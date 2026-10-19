import { Optional } from '@angular/core';
import { OnboardingProgressService } from '../wizard-shared/onboarding-progress.service';
import { ConfigurationChanges } from '../wizard-shared/configuration-changes';
import { WizardStepperComponent } from '../wizard-shared/wizard-stepper.component';
import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import {
  WizardService,
  StateOption,
  ClientTypeOption,
  HealthPlanOption,
  AboutResponse,
  ClientHealthPlansResponse,
} from '../wizard-shared/wizard.service';

const DRAFT_KEY = 'wizard_step1_draft';

interface Step1Draft {
  clinicName: string;
  clinicTypeIds?: string[];
  clinicType?: string; // rascunhos anteriores
  shortDescription: string;
  city: string;
  state: string;
  clinicPhone: string;
  clinicEmail: string;
  acceptsHealthPlan: boolean | null;
  healthPlanIds: number[];
}

@Component({
  selector: 'app-wizard-step-1-about',
  standalone: true,
  imports: [WizardStepperComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    MultiSelectModule,
    WizardSummaryComponent,
  ],
  templateUrl: './wizard-step-1-about.component.html',
  styleUrls: ['./wizard-step-1-about.component.scss'],
})
export class WizardStep1AboutComponent implements OnInit {
  readonly configurationChanges = new ConfigurationChanges(() => [this.clinicName, [...this.clinicTypeIds].sort(), this.shortDescription, this.city, this.state, this.clinicPhone, this.clinicEmail, this.acceptsHealthPlan, [...this.healthPlanIds].sort()], () => this.saveConfiguration());


  // ─── Campos do formulário ──────────────────────────────────────────────────
  clinicName = '';
  clinicTypeIds: string[] = [];
  private primaryClinicTypeId: number | null = null;
  shortDescription = '';
  city = '';
  state = '';
  clinicPhone = '';
  clinicEmail = '';
  acceptsHealthPlan: boolean | null = null;
  healthPlanIds: number[] = [];

  // ─── Listas carregadas da API ──────────────────────────────────────────────
  clinicTypes: ClientTypeOption[] = [];
  states: StateOption[] = [];
  healthPlans: HealthPlanOption[] = [];

  // ─── Estado de UI ──────────────────────────────────────────────────────────
  loadingLists = signal(true);
  saving = signal(false);
  private configurationLoaded = false;
  submitAttempted = signal(false);
  saveError = signal('');

  // ─── Validação ─────────────────────────────────────────────────────────────
  get isFormValid(): boolean {
    return (
      this.clinicName.trim() !== '' &&
      this.clinicTypeIds.length > 0 &&
      this.shortDescription.trim() !== '' &&
      this.city.trim() !== '' &&
      this.state != null && this.state !== '' &&
      this.clinicPhone.trim() !== '' &&
      this.clinicEmail.trim() !== '' &&
      this.acceptsHealthPlan !== null &&
      (this.acceptsHealthPlan === false || this.healthPlanIds.length > 0)
    );
  }

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(s => ({
    ...s,
    current: s.id === 1,
    completed: s.id === 1,
  }));

  constructor(
    private router: Router,
    private wizardService: WizardService,
    @Optional() private readonly progress?: OnboardingProgressService,
  ) {}

  async ngOnInit(): Promise<void> {


    try {
      const [states, clientTypes, healthPlans, about, clientHealthPlans] = await Promise.all([
        this.wizardService.getStates(),
        this.wizardService.getClientTypes(),
        this.wizardService.getHealthPlans(),
        this.wizardService.getAbout(),
        this.wizardService.getClientHealthPlans(),
      ]);
      this.states = states;
      this.clinicTypes = clientTypes;
      this.healthPlans = healthPlans;
      this.primaryClinicTypeId = about.typeClientId;
      this.applySavedData(about, clientHealthPlans);
      this.configurationLoaded = true;
      this.configurationChanges.markSaved();
      if (!this.progress?.isConfigurationComplete()) this.restoreDraft();
    } catch {
      // Em caso de falha na API, mantém as listas vazias sem bloquear a tela
    } finally {
      this.loadingLists.set(false);
    }
  }

  // ─── Draft / sessionStorage ───────────────────────────────────────────────

  saveDraft(): void {
    const draft: Step1Draft = {
      clinicName: this.clinicName,
      clinicTypeIds: [...this.clinicTypeIds],
      shortDescription: this.shortDescription,
      city: this.city,
      state: this.state,
      clinicPhone: this.clinicPhone,
      clinicEmail: this.clinicEmail,
      acceptsHealthPlan: this.acceptsHealthPlan,
      healthPlanIds: this.healthPlanIds,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  private restoreDraft(): boolean {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft: Step1Draft = JSON.parse(raw);
      this.clinicName = draft.clinicName ?? '';
      this.clinicTypeIds = Array.isArray(draft.clinicTypeIds)
        ? draft.clinicTypeIds.map(String)
        : draft.clinicType ? [String(draft.clinicType)] : [];
      this.shortDescription = draft.shortDescription ?? '';
      this.city = draft.city ?? '';
      this.state = draft.state ?? '';
      this.clinicPhone = draft.clinicPhone ?? '';
      this.clinicEmail = draft.clinicEmail ?? '';
      this.acceptsHealthPlan = draft.acceptsHealthPlan ?? null;
      this.healthPlanIds = draft.healthPlanIds ?? [];
      return true;
    } catch {
      // draft corrompido — ignora
      return false;
    }
  }

  private applySavedData(about: AboutResponse, clientHealthPlans: ClientHealthPlansResponse): void {
    this.clinicName = about.clientName ?? '';
    this.clinicTypeIds = about.typeClientIds?.length
      ? about.typeClientIds.map(String)
      : about.typeClientId != null ? [String(about.typeClientId)] : [];
    this.shortDescription = about.description ?? '';
    this.city = about.cityName ?? '';
    this.state = about.stateId != null ? String(about.stateId) : '';
    this.clinicPhone = this.formatPhoneNumber(about.phoneNumber ?? '');
    this.clinicEmail = about.email ?? '';
    this.acceptsHealthPlan = clientHealthPlans.acceptsHealthPlan ?? about.acceptsHealthPlan ?? null;
    this.healthPlanIds = clientHealthPlans.healthPlans.map(plan => plan.id);
  }

  // ─── Handlers de campo ───────────────────────────────────────────────────

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatPhoneNumber(input.value);

    this.clinicPhone = formatted;
    input.value = formatted;
  }

  private formatPhoneNumber(value: string): string {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      digits = digits.substring(2);
    }
    digits = digits.substring(0, 11);

    let formatted = '';
    if (digits.length === 0) {
      formatted = '';
    } else if (digits.length <= 2) {
      formatted = `(${digits}`;
    } else if (digits.length <= 6) {
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    } else if (digits.length <= 10) {
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    } else {
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
    }

    return formatted;
  }

  selectHealthPlan(value: boolean): void {
    this.acceptsHealthPlan = value;
    if (!value) {
      this.healthPlanIds = [];
    }
    this.saveDraft();
  }

  onHealthPlansChange(): void {
    this.saveDraft();
  }

  recommendByAi(): void {
    this.clinicTypeIds = this.clinicTypes.length > 0 ? [this.clinicTypes[0].id] : [];
    this.shortDescription = 'Clínica odontológica moderna focada em implantes, estética e ortodontia de alta performance.';
    this.city = 'São Paulo';
    this.state = this.states.find(state => state.name === 'São Paulo')?.id ?? '';
    if (!this.clinicPhone) {
      this.clinicPhone = '(11) 99999-9999';
    }
    this.saveDraft();
  }

  // ─── Navegação ───────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/']);
  }

  async goNext(): Promise<void> {
    if (this.progress?.isConfigurationComplete() && this.configurationChanges.hasChanges()) {
      void this.router.navigate(['/wizard-step-2-specialty']);
      return;
    }
    if (await this.saveConfiguration()) void this.router.navigate(['/wizard-step-2-specialty']);
  }

  async saveConfiguration(): Promise<boolean> {
    this.saveError.set('');
    if (!this.configurationLoaded) {
      this.saveError.set('Recarregue a tela para obter a configuração antes de salvar.');
      return false;
    }
    if (this.saving()) return false;
    this.submitAttempted.set(true);

    if (!this.isFormValid) {
      return false;
    }

    this.saveError.set('');
    const snapshot = this.configurationChanges.snapshot();
    this.saving.set(true);
    try {
      const selectedTypeIds = this.clinicTypeIds.map(Number);
      const primaryTypeId = this.primaryClinicTypeId != null
        && selectedTypeIds.includes(this.primaryClinicTypeId)
        ? this.primaryClinicTypeId : selectedTypeIds[0];
      const rawPhone = this.clinicPhone.replace(/\D/g, '');
      await this.wizardService.saveAbout({
        clientName: this.clinicName.trim(),
        email: this.clinicEmail.trim(),
        typeClientId: primaryTypeId,
        typeClientIds: selectedTypeIds,
        description: this.shortDescription.trim(),
        cityName: this.city.trim(),
        stateId: Number(this.state),
        phoneNumber: `+55${rawPhone}`,
        acceptsHealthPlan: this.acceptsHealthPlan!,
      });
      await this.wizardService.saveHealthPlans(this.healthPlanIds);
      sessionStorage.removeItem(DRAFT_KEY);
      this.configurationChanges.markSaved(snapshot);
      return true;
    } catch (error) {
      const message = error instanceof HttpErrorResponse ? String(error.error?.message ?? '') : '';
      this.saveError.set(message.includes('Remove services and specialties')
        ? 'Remova as especialidades e os serviços dessa área nos próximos passos antes de excluí-la.'
        : 'Não foi possível salvar os dados da clínica. Tente novamente.');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  activateService(): void {
    // Ativar atendimento
  }
}
