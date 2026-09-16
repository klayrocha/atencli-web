import { Component, computed, OnInit, signal } from '@angular/core';
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
  imports: [
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

  loadingServices = signal(true);
  saving = signal(false);
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

  // Paginação
  pageSize = 10;
  currentPage = signal(1);
  totalPages = computed(() => Math.ceil(this.allServices.length / this.pageSize));

  get pagedServices(): ServiceItem[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.allServices.slice(start, start + this.pageSize);
  }

  Math = Math;

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  // Seleção
  get selectedServices(): ServiceItem[] {
    return this.allServices.filter(s => s.enabled);
  }

  get canSave(): boolean {
    return this.selectedServices.every(service =>
      service.practicePrice !== null &&
      service.insurancePrice !== null &&
      service.duration !== null
    );
  }

  get invalidServices(): ServiceItem[] {
    return this.selectedServices.filter(service =>
      service.practicePrice === null ||
      service.insurancePrice === null ||
      service.duration === null
    );
  }

  isServiceInvalid(service: ServiceItem): boolean {
    return service.enabled && (
      service.practicePrice === null ||
      service.insurancePrice === null ||
      service.duration === null
    );
  }

  get allPageSelected(): boolean {
    return this.pagedServices.every(s => s.enabled);
  }

  get somePageSelected(): boolean {
    return !this.allPageSelected && this.pagedServices.some(s => s.enabled);
  }

  togglePageSelection(): void {
    const allSelected = this.allPageSelected;
    this.pagedServices.forEach(s => (s.enabled = !allSelected));
  }

  toggleService(service: ServiceItem): void {
    service.enabled = !service.enabled;
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
      }
    });
  }

  copyPracticePriceToInsurance(service: ServiceItem): void {
    if (service.enabled && service.practicePrice !== null) {
      service.insurancePrice = service.practicePrice;
    }
  }

  copySuggestedPriceToPractice(service: ServiceItem): void {
    if (service.enabled && service.suggestedPrice !== null) {
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
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const about = await this.wizardService.getAbout();
      if (about.typeClientId == null) {
        return;
      }

      const [catalog, configured] = await Promise.all([
        this.wizardService.getServicesByTypeClient(about.typeClientId),
        this.wizardService.getClientServices(),
      ]);
      const configuredById = new Map(configured.services.map(service => [service.id, service]));

      this.allServices = catalog.map(service => {
        const configuredService = configuredById.get(Number(service.id));
        return {
          id: Number(service.id),
          name: service.name,
          icon: 'pi-briefcase',
          category: 'Serviço',
          suggestedPrice: service.valor ?? configuredService?.defaultValue ?? null,
          practicePrice: configuredService?.price ?? null,
          insurancePrice: configuredService?.planPrice ?? null,
          duration: configuredService?.durationMinutes ?? null,
          enabled: configuredService != null,
        };
      });
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
    this.submitAttempted.set(true);

    if (!this.canSave) {
      this.goToFirstInvalidService();
      return;
    }

    this.saving.set(true);
    try {
      await this.wizardService.saveServices(this.selectedServices.map(service => ({
        serviceId: service.id,
        price: service.practicePrice!,
        planPrice: service.insurancePrice!,
        durationMinutes: service.duration!,
      })));
      this.router.navigate(['/wizard-step-4-schedule']);
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  private goToFirstInvalidService(): void {
    const firstInvalid = this.invalidServices[0];
    if (!firstInvalid) return;

    const index = this.allServices.indexOf(firstInvalid);
    const page = Math.floor(index / this.pageSize) + 1;
    this.currentPage.set(page);
  }

  activateService(): void {}
}
