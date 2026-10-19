import { Optional } from '@angular/core';
import { OnboardingProgressService } from '../wizard-shared/onboarding-progress.service';
import { ConfigurationChanges } from '../wizard-shared/configuration-changes';
import { WizardStepperComponent } from '../wizard-shared/wizard-stepper.component';
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import { WizardService } from '../wizard-shared/wizard.service';

export interface ServiceItem {
  id: number;
  name: string;
  icon: string;
  category: string;
  suggestedPrice: number | null;
  practicePrice: number | null;
  insurancePrice: number | null;
  duration: number | null;
  enabled: boolean;
}

export interface DurationOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-wizard-step-3-services',
  standalone: true,
  imports: [WizardStepperComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    WizardSummaryComponent,
  ],
  templateUrl: './wizard-step-3-services.component.html',
  styleUrls: ['./wizard-step-3-services.component.scss'],
})
export class WizardStep3ServicesComponent implements OnInit {
  readonly configurationChanges = new ConfigurationChanges(() => this.allServices.map(({id, enabled, practicePrice, insurancePrice, duration}) => ({id, enabled, practicePrice, insurancePrice, duration})), () => this.saveConfiguration());


  acceptsHealthPlan = true;
  loadingServices = signal(true);
  saving = signal(false);
  saveError = signal('');
  private configurationLoaded = false;
  submitAttempted = signal(false);

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(s => ({
    ...s,
    current: s.id === 3,
    completed: s.id <= 2,
  }));

  durationOptions: DurationOption[] = [
    { label: '15 min', value: 15 },
    { label: '20 min', value: 20 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
    { label: '90 min', value: 90 },
    { label: '120 min', value: 120 },
  ];

  allServices: ServiceItem[] = [];

  showSelectedOnly = false;
  searchTerm = '';
  exclusionInput = '';
  excludedTerms: string[] = [];

  private normalizeTerm(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  }

  get filteredServices(): ServiceItem[] {
    const search = this.normalizeTerm(this.searchTerm);
    const exclusions = this.excludedTerms.map(term => this.normalizeTerm(term));
    return this.allServices.filter(service => {
      const text = this.normalizeTerm(service.name + ' ' + service.category);
      return (!this.showSelectedOnly || service.enabled) && text.includes(search) && !exclusions.some(term => text.includes(term));
    });
  }

  changeSelectedOnly(value: boolean): void {
    this.showSelectedOnly = value;
    this.currentPage.set(1);
  }

  changeSearch(value: string): void {
    this.searchTerm = value;
    this.currentPage.set(1);
  }

  addExclusion(): void {
    const term = this.exclusionInput.trim();
    if (!term) return;
    if (!this.excludedTerms.some(item => this.normalizeTerm(item) === this.normalizeTerm(term))) {
      this.excludedTerms = [...this.excludedTerms, term];
      this.currentPage.set(1);
    }
    this.exclusionInput = '';
  }

  removeExclusion(term: string): void {
    this.excludedTerms = this.excludedTerms.filter(item => item !== term);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.showSelectedOnly = false;
    this.searchTerm = '';
    this.exclusionInput = '';
    this.excludedTerms = [];
    this.currentPage.set(1);
  }

  // Paginação
  readonly pageSizeOptions = [10, 25, 50, 100];
  pageSize = 10;
  currentPage = signal(1);
  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredServices.length / this.pageSize));
  }

  changePageSize(size: number): void {
    if (!this.pageSizeOptions.includes(size)) return;
    this.pageSize = size;
    this.currentPage.set(1);
  }

  get pagedServices(): ServiceItem[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredServices.slice(start, start + this.pageSize);
  }

  Math = Math;

  get pagesArray(): number[] {
    return Array.from({ length: Math.min(4, this.totalPages() - this.currentPage() + 1) }, (_, i) => this.currentPage() + i);
  }

  // Seleção
  get selectedServices(): ServiceItem[] {
    return this.allServices.filter(s => s.enabled);
  }

  get canSave(): boolean {
    return this.invalidServices.length === 0;
  }

  get invalidServices(): ServiceItem[] {
    return this.selectedServices.filter(service => this.isServiceInvalid(service));
  }

  isPriceValid(value: number | null): boolean {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }

  isServiceInvalid(service: ServiceItem): boolean {
    return service.enabled && (
      !this.isPriceValid(service.practicePrice) ||
      (this.acceptsHealthPlan && !this.isPriceValid(service.insurancePrice)) ||
      service.duration === null
    );
  }

  get allPageSelected(): boolean {
    return this.pagedServices.length > 0 && this.pagedServices.every(s => s.enabled);
  }

  get somePageSelected(): boolean {
    return !this.allPageSelected && this.pagedServices.some(s => s.enabled);
  }

  togglePageSelection(): void {
    const allSelected = this.allPageSelected;
    this.pagedServices.forEach(s => (s.enabled = !allSelected));
    this.currentPage.set(Math.min(this.currentPage(), this.totalPages()));
  }

  toggleService(service: ServiceItem): void {
    service.enabled = !service.enabled;
    this.currentPage.set(Math.min(this.currentPage(), this.totalPages()));
  }

  // Bulk actions
  applyDefaultDuration(): void {
    this.selectedServices.forEach(s => {
      if (!s.duration) s.duration = 30;
    });
  }

  acceptSuggestions(): void {
    this.selectedServices.forEach(s => {
      if (s.suggestedPrice !== null) {
        s.practicePrice = s.suggestedPrice;
        if (this.acceptsHealthPlan) s.insurancePrice = s.suggestedPrice;
      }
    });
  }

  copySuggestedPriceToPractice(service: ServiceItem): void {
    if (service.enabled && service.practicePrice === null && this.isPriceValid(service.suggestedPrice)) {
      service.practicePrice = service.suggestedPrice;
    }
  }

  getDurationLabel(value: number | null): string {
    if (!value) return '–';
    const opt = this.durationOptions.find(d => d.value === value);
    return opt ? opt.label : `${value} min`;
  }

  formatCurrency(value: number | null): string {
    if (value === null) return '';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  constructor(
    private router: Router,
    private wizardService: WizardService,
    @Optional() private readonly progress?: OnboardingProgressService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const about = await this.wizardService.getAbout();
      this.acceptsHealthPlan = about.acceptsHealthPlan !== false;
      const typeIds = about.typeClientIds?.length
        ? about.typeClientIds
        : about.typeClientId != null ? [about.typeClientId] : [];
      if (typeIds.length === 0) return;

      const [catalog, configured, clientTypes] = await Promise.all([
        this.wizardService.getServicesByTypeClients(typeIds),
        this.wizardService.getClientServices(),
        this.wizardService.getClientTypes(),
      ]);
      const typeNames = new Map(clientTypes.map(type => [Number(type.id), type.name]));
      const configuredById = new Map(configured.services.map(service => [service.id, service]));

      this.allServices = catalog.map(service => {
        const configuredService = configuredById.get(Number(service.id));
        return {
          id: Number(service.id),
          name: service.name,
          icon: 'pi-briefcase',
          category: typeIds.length > 1 ? typeNames.get(service.typeClientId) ?? 'Serviço' : 'Serviço',
          suggestedPrice: service.valor ?? configuredService?.defaultValue ?? null,
          practicePrice: configuredService?.price ?? null,
          insurancePrice: configuredService?.planPrice ?? null,
          duration: configuredService?.durationMinutes ?? null,
          enabled: configuredService != null,
        };
      });
      this.configurationLoaded = true;
      this.configurationChanges.markSaved();
    } catch {
      // Em caso de falha na API, mantém a lista vazia sem bloquear a tela
    } finally {
      this.loadingServices.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/wizard-step-2-specialty']);
  }

  async goNext(): Promise<void> {
    if (this.progress?.isConfigurationComplete() && this.configurationChanges.hasChanges()) {
      void this.router.navigate(['/wizard-step-4-schedule']);
      return;
    }
    if (await this.saveConfiguration()) void this.router.navigate(['/wizard-step-4-schedule']);
  }

  async saveConfiguration(): Promise<boolean> {
    this.saveError.set('');
    if (!this.configurationLoaded) {
      this.saveError.set('Recarregue a tela para obter a configuração antes de salvar.');
      return false;
    }
    if (this.saving()) return false;
    this.submitAttempted.set(true);

    if (!this.canSave) {
      this.goToFirstInvalidService();
      return false;
    }

    const snapshot = this.configurationChanges.snapshot();
    this.saving.set(true);
    try {
      await this.wizardService.saveServices(this.selectedServices.map(service => ({
        serviceId: service.id,
        price: service.practicePrice!,
        planPrice: this.acceptsHealthPlan ? service.insurancePrice! : null,
        durationMinutes: service.duration!,
      })));
      this.configurationChanges.markSaved(snapshot);
      return true;
    } catch {
      this.saveError.set('Não foi possível salvar as configurações. Tente novamente.');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  private goToFirstInvalidService(): void {
    const firstInvalid = this.invalidServices[0];
    if (!firstInvalid) return;

    this.clearFilters();
    this.showSelectedOnly = true;
    const index = this.filteredServices.indexOf(firstInvalid);
    const page = Math.floor(index / this.pageSize) + 1;
    this.currentPage.set(page);
  }

  activateService(): void {}
}
