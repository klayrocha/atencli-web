import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import { WizardService } from '../wizard-shared/wizard.service';

const DRAFT_KEY = 'wizard_step2_specialties_draft';

export interface SpecialtyItem {
  id: number;
  name: string;
  category?: string;
  icon?: string;
}

@Component({
  selector: 'app-wizard-step-2-specialty',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    WizardSummaryComponent,
  ],
  templateUrl: './wizard-step-2-specialty.component.html',
  styleUrls: ['./wizard-step-2-specialty.component.scss'],
})
export class WizardStep2SpecialtyComponent implements OnInit {
  searchTerm = '';
  saving = signal(false);
  loadingSpecialties = signal(true);

  // Lista carregada do catálogo oficial da API para o tipo da clínica.
  availableSpecialties: SpecialtyItem[] = [];

  selectedSpecialties: SpecialtyItem[] = [];

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(s => ({
    ...s,
    current: s.id === 2,
    completed: s.id <= 2,
  }));

  constructor(
    private router: Router,
    private wizardService: WizardService,
  ) {}

  async ngOnInit(): Promise<void> {
    const draftSpecialtyIds = this.restoreDraft();

    try {
      const about = await this.wizardService.getAbout();
      if (about.typeClientId == null) {
        return;
      }

      const [specialties, clientSpecialties] = await Promise.all([
        this.wizardService.getSpecialtiesByTypeClient(about.typeClientId),
        this.wizardService.getClientSpecialties(),
      ]);

      this.availableSpecialties = specialties.map(specialty => ({
        id: Number(specialty.id),
        name: specialty.name,
      }));
      const selectedIds = clientSpecialties.specialties.map(specialty => Number(specialty.id));
      this.selectedSpecialties = this.availableSpecialties.filter(specialty => selectedIds.includes(specialty.id));
    } catch {
      if (draftSpecialtyIds !== null) {
        this.selectedSpecialties = this.availableSpecialties.filter(specialty => draftSpecialtyIds.includes(specialty.id));
      }
      // Em caso de falha na API, usa o rascunho local como fallback
    } finally {
      this.loadingSpecialties.set(false);
    }
  }

  get filteredSpecialties(): SpecialtyItem[] {
    if (!this.searchTerm.trim()) {
      return this.availableSpecialties;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.availableSpecialties.filter(
      s => s.name.toLowerCase().includes(term) || (s.category && s.category.toLowerCase().includes(term))
    );
  }

  isSelected(specialty: SpecialtyItem): boolean {
    return this.selectedSpecialties.some(s => s.id === specialty.id);
  }

  toggleSpecialty(specialty: SpecialtyItem): void {
    const index = this.selectedSpecialties.findIndex(s => s.id === specialty.id);
    if (index > -1) {
      this.selectedSpecialties.splice(index, 1);
    } else {
      this.selectedSpecialties.push({ id: specialty.id, name: specialty.name });
    }
    this.saveDraft();
  }

  removeSpecialty(specialty: SpecialtyItem): void {
    this.selectedSpecialties = this.selectedSpecialties.filter(s => s.id !== specialty.id);
    this.saveDraft();
  }

  recommendByAi(): void {
    // Sugestão inteligente de especialidades com alta procura
    const aiSuggestedIds = [2, 3, 7, 8, 10]; // Dentística, Implantodontia, Periodontia, Ortodontia, Harmonização
    const suggestions = this.availableSpecialties.filter(s => aiSuggestedIds.includes(s.id));
    this.selectedSpecialties = suggestions.map(s => ({ id: s.id, name: s.name }));
    this.saveDraft();
  }

  selectAll(): void {
    this.selectedSpecialties = this.availableSpecialties.map(s => ({ id: s.id, name: s.name }));
    this.saveDraft();
  }

  clearAll(): void {
    this.selectedSpecialties = [];
    this.saveDraft();
  }

  private saveDraft(): void {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify(this.selectedSpecialties.map(specialty => specialty.id))
    );
  }

  private restoreDraft(): number[] | null {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw === null) {
        return null;
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(id => Number.isInteger(id)) : null;
    } catch {
      return null;
    }
  }

  goBack(): void {
    this.router.navigate(['/wizard-step-1-aboult']);
  }

  async goNext(): Promise<void> {
    this.saving.set(true);
    try {
      const specialtyIds = this.selectedSpecialties.map(specialty => specialty.id);
      await this.wizardService.saveSpecialties(specialtyIds);
      sessionStorage.removeItem(DRAFT_KEY);
      this.router.navigate(['/wizard-step-3-services']);
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
