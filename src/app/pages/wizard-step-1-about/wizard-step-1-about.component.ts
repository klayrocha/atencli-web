import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import { WizardService, StateOption, ClientTypeOption } from '../wizard-shared/wizard.service';

const DRAFT_KEY = 'wizard_step1_draft';

interface Step1Draft {
  clinicName: string;
  clinicType: string;
  shortDescription: string;
  city: string;
  state: string;
  clinicPhone: string;
  clinicEmail: string;
  acceptsHealthPlan: boolean | null;
}

@Component({
  selector: 'app-wizard-step-1-about',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    WizardSummaryComponent,
  ],
  templateUrl: './wizard-step-1-about.component.html',
  styleUrls: ['./wizard-step-1-about.component.scss'],
})
export class WizardStep1AboutComponent implements OnInit {

  // ─── Campos do formulário ──────────────────────────────────────────────────
  clinicName = '';
  clinicType = '';
  shortDescription = '';
  city = '';
  state = '';
  clinicPhone = '';
  clinicEmail = '';
  acceptsHealthPlan: boolean | null = null;

  // ─── Listas carregadas da API ──────────────────────────────────────────────
  clinicTypes: ClientTypeOption[] = [];
  states: StateOption[] = [];

  // ─── Estado de UI ──────────────────────────────────────────────────────────
  loadingLists = signal(true);
  saving = signal(false);
  submitAttempted = signal(false);

  // ─── Validação ─────────────────────────────────────────────────────────────
  get isFormValid(): boolean {
    return (
      this.clinicName.trim() !== '' &&
      this.clinicType != null && this.clinicType !== '' &&
      this.shortDescription.trim() !== '' &&
      this.city.trim() !== '' &&
      this.state != null && this.state !== '' &&
      this.clinicPhone.trim() !== '' &&
      this.clinicEmail.trim() !== '' &&
      this.acceptsHealthPlan !== null
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
  ) {}

  async ngOnInit(): Promise<void> {
    this.restoreDraft();

    try {
      const [states, clientTypes] = await Promise.all([
        this.wizardService.getStates(),
        this.wizardService.getClientTypes(),
      ]);
      this.states = states;
      this.clinicTypes = clientTypes;
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
      clinicType: this.clinicType,
      shortDescription: this.shortDescription,
      city: this.city,
      state: this.state,
      clinicPhone: this.clinicPhone,
      clinicEmail: this.clinicEmail,
      acceptsHealthPlan: this.acceptsHealthPlan,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  private restoreDraft(): void {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: Step1Draft = JSON.parse(raw);
      this.clinicName = draft.clinicName ?? '';
      this.clinicType = draft.clinicType ?? '';
      this.shortDescription = draft.shortDescription ?? '';
      this.city = draft.city ?? '';
      this.state = draft.state ?? '';
      this.clinicPhone = draft.clinicPhone ?? '';
      this.clinicEmail = draft.clinicEmail ?? '';
      this.acceptsHealthPlan = draft.acceptsHealthPlan ?? null;
    } catch {
      // draft corrompido — ignora
    }
  }

  // ─── Handlers de campo ───────────────────────────────────────────────────

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').substring(0, 11);

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

    this.clinicPhone = formatted;
    input.value = formatted;
  }

  selectHealthPlan(value: boolean): void {
    this.acceptsHealthPlan = value;
    this.saveDraft();
  }

  recommendByAi(): void {
    this.clinicType = this.clinicTypes.length > 0 ? this.clinicTypes[0].id : '';
    this.shortDescription = 'Clínica odontológica moderna focada em implantes, estética e ortodontia de alta performance.';
    this.city = 'São Paulo';
    this.state = 'SP';
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
    this.submitAttempted.set(true);

    if (!this.isFormValid) {
      return;
    }

    this.saving.set(true);
    try {
      const rawPhone = this.clinicPhone.replace(/\D/g, '');
      await this.wizardService.saveAbout({
        clientName: this.clinicName.trim(),
        email: this.clinicEmail.trim(),
        typeClientId: Number(this.clinicType),
        description: this.shortDescription.trim(),
        cityName: this.city.trim(),
        stateId: Number(this.state),
        phoneNumber: `+55${rawPhone}`,
        acceptsHealthPlan: this.acceptsHealthPlan!,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      this.router.navigate(['/wizard-step-2-specialty']);
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  activateService(): void {
    // Ativar atendimento
  }
}
