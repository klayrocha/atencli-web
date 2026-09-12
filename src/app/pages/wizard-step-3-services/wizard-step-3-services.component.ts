import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

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
export class WizardStep3ServicesComponent {

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

  // Catálogo completo de serviços
  allServices: ServiceItem[] = [
    { id: 1,  name: 'Consulta Clínica Geral',          icon: 'pi-user-plus',      category: 'Consulta',          suggestedPrice: 250,  practicePrice: 250,  insurancePrice: 250,  duration: 30,  enabled: true  },
    { id: 2,  name: 'Limpeza e Profilaxia',              icon: 'pi-eraser',         category: 'Prevenção',         suggestedPrice: 300,  practicePrice: 300,  insurancePrice: 400,  duration: 45,  enabled: true  },
    { id: 3,  name: 'Restauração em Resina (Classe I)',  icon: 'pi-cog',            category: 'Restauração',       suggestedPrice: 450,  practicePrice: 400,  insurancePrice: null, duration: 60,  enabled: true  },
    { id: 4,  name: 'Jateamento Dental Caseiro (Arcada)',icon: 'pi-sparkles',       category: 'Estética',          suggestedPrice: 800,  practicePrice: null, insurancePrice: null, duration: 60,  enabled: false },
    { id: 5,  name: 'Ortodontia – Manutenção Mensal',   icon: 'pi-sync',           category: 'Ortodontia',        suggestedPrice: 200,  practicePrice: 200,  insurancePrice: null, duration: 20,  enabled: false },
    { id: 6,  name: 'Aplicação de Flúor',               icon: 'pi-shield',         category: 'Prevenção',         suggestedPrice: 100,  practicePrice: 99,   insurancePrice: null, duration: 15,  enabled: false },
    { id: 7,  name: 'Cirurgia de Extração Simples',      icon: 'pi-bolt',           category: 'Cirurgia',          suggestedPrice: 600,  practicePrice: null, insurancePrice: null, duration: 90,  enabled: false },
    { id: 8,  name: 'Implante Dentário (por unidade)',   icon: 'pi-plus-circle',    category: 'Implantodontia',    suggestedPrice: 3500, practicePrice: null, insurancePrice: null, duration: 120, enabled: false },
    { id: 9,  name: 'Tratamento de Canal (Unirradicular)',icon: 'pi-minus-circle',  category: 'Endodontia',        suggestedPrice: 900,  practicePrice: null, insurancePrice: null, duration: 90,  enabled: false },
    { id: 10, name: 'Clareamento a Laser (Sessão)',      icon: 'pi-sun',            category: 'Estética',          suggestedPrice: 700,  practicePrice: null, insurancePrice: null, duration: 60,  enabled: false },
    { id: 11, name: 'Radiografia Periapical',            icon: 'pi-eye',            category: 'Exames',            suggestedPrice: 80,   practicePrice: null, insurancePrice: null, duration: 15,  enabled: false },
    { id: 12, name: 'Moldagem para Placa Bruxismo',      icon: 'pi-clone',          category: 'DTM & Dor',         suggestedPrice: 400,  practicePrice: null, insurancePrice: null, duration: 30,  enabled: false },
    { id: 13, name: 'Consulta Odontopediátrica',         icon: 'pi-heart',          category: 'Infantil',          suggestedPrice: 200,  practicePrice: null, insurancePrice: null, duration: 30,  enabled: false },
    { id: 14, name: 'Faceta de Porcelana (por dente)',   icon: 'pi-star',           category: 'Estética',          suggestedPrice: 2000, practicePrice: null, insurancePrice: null, duration: 120, enabled: false },
    { id: 15, name: 'Periodontia – Raspagem (por sext)',  icon: 'pi-align-left',    category: 'Periodontia',       suggestedPrice: 350,  practicePrice: null, insurancePrice: null, duration: 45,  enabled: false },
    { id: 16, name: 'Prótese Parcial Removível',         icon: 'pi-box',            category: 'Prótese',           suggestedPrice: 1800, practicePrice: null, insurancePrice: null, duration: 60,  enabled: false },
    { id: 17, name: 'Avaliação Ortodôntica',             icon: 'pi-desktop',        category: 'Ortodontia',        suggestedPrice: 150,  practicePrice: null, insurancePrice: null, duration: 30,  enabled: false },
    { id: 18, name: 'Gengivoplastia a Laser',            icon: 'pi-bolt',           category: 'Estética',          suggestedPrice: 1200, practicePrice: null, insurancePrice: null, duration: 60,  enabled: false },
    { id: 19, name: 'Botox Terapêutico (Bruxismo)',      icon: 'pi-verified',       category: 'Harmonização',      suggestedPrice: 900,  practicePrice: null, insurancePrice: null, duration: 45,  enabled: false },
    { id: 20, name: 'Retainer/Contenção Pós-Ortodontia',icon: 'pi-link',            category: 'Ortodontia',        suggestedPrice: 400,  practicePrice: null, insurancePrice: null, duration: 30,  enabled: false },
    { id: 21, name: 'Consulta Periodontal',              icon: 'pi-user',           category: 'Periodontia',       suggestedPrice: 220,  practicePrice: null, insurancePrice: null, duration: 30,  enabled: false },
    { id: 22, name: 'Exodontia de Siso',                 icon: 'pi-exclamation-circle', category: 'Cirurgia',     suggestedPrice: 1200, practicePrice: null, insurancePrice: null, duration: 90,  enabled: false },
    { id: 23, name: 'Aparelho Fixo (Instalação)',        icon: 'pi-prime',          category: 'Ortodontia',        suggestedPrice: 2800, practicePrice: null, insurancePrice: null, duration: 90,  enabled: false },
    { id: 24, name: 'Alinhador Transparente (Plano)',    icon: 'pi-palette',        category: 'Ortodontia',        suggestedPrice: 4500, practicePrice: null, insurancePrice: null, duration: 30,  enabled: false },
    { id: 25, name: 'Retratamento de Canal',             icon: 'pi-refresh',        category: 'Endodontia',        suggestedPrice: 1200, practicePrice: null, insurancePrice: null, duration: 120, enabled: false },
    { id: 26, name: 'Cirurgia Periodontal Ressectiva',   icon: 'pi-cut',            category: 'Periodontia',       suggestedPrice: 1500, practicePrice: null, insurancePrice: null, duration: 90,  enabled: false },
    { id: 27, name: 'Tomografia Odontológica (CBCT)',    icon: 'pi-chart-scatter',  category: 'Exames',            suggestedPrice: 350,  practicePrice: null, insurancePrice: null, duration: 15,  enabled: false },
    { id: 28, name: 'Cerâmica Inlay/Onlay',              icon: 'pi-objects-column', category: 'Restauração',       suggestedPrice: 1500, practicePrice: null, insurancePrice: null, duration: 90,  enabled: false },
    { id: 29, name: 'Higienização Profissional Completa',icon: 'pi-check-circle',   category: 'Prevenção',         suggestedPrice: 320,  practicePrice: null, insurancePrice: null, duration: 60,  enabled: false },
    { id: 30, name: 'Prótese Fixa sobre Implante',       icon: 'pi-crown',          category: 'Implantodontia',    suggestedPrice: 2500, practicePrice: null, insurancePrice: null, duration: 60,  enabled: false },
  ];

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

  getDurationLabel(value: number | null): string {
    if (!value) return '–';
    const opt = this.durationOptions.find(d => d.value === value);
    return opt ? opt.label : `${value} min`;
  }

  formatCurrency(value: number | null): string {
    if (value === null) return '';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/wizard-step-2-specialty']);
  }

  goNext(): void {
    this.router.navigate(['/wizard-step-4-schedule']);
  }

  activateService(): void {}
}
