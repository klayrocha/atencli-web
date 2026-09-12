import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

export interface SpecialtyItem {
  id: number;
  name: string;
  category?: string;
  icon?: string;
}

export interface ClientSpecialtiesConfig {
  clientUuid: string;
  specialties: SpecialtyItem[];
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
export class WizardStep2SpecialtyComponent {
  clientUuid = 'd1acd1ad-cff1-40d7-86d3-753933746f52';
  searchTerm = '';

  // Lista de especialidades disponíveis (baseada no catálogo oficial da Atenclin)
  availableSpecialties: SpecialtyItem[] = [
    { id: 1,  name: 'Cirurgia e Traumatologia Buco-Maxilo-Faciais', category: 'Cirurgia' },
    { id: 2,  name: 'Dentística', category: 'Estética & Restauração' },
    { id: 3,  name: 'Implantodontia', category: 'Cirurgia & Reabilitação' },
    { id: 4,  name: 'Endodontia', category: 'Tratamento de Canal' },
    { id: 5,  name: 'Estomatologia', category: 'Diagnóstico' },
    { id: 6,  name: 'Odontopediatria', category: 'Infantil' },
    { id: 7,  name: 'Periodontia', category: 'Gengiva & Suporte' },
    { id: 8,  name: 'Ortodontia', category: 'Alinhamento & Aparelhos' },
    { id: 9,  name: 'Prótese Dentária', category: 'Reabilitação Oral' },
    { id: 10, name: 'Harmonização Orofacial', category: 'Estética Facial' },
    { id: 11, name: 'Disfunção Temporomandibular e Dor Orofacial', category: 'DTM & Dor' },
    { id: 12, name: 'Radiologia Odontológica e Imaginologia', category: 'Exames' },
    { id: 13, name: 'Odontogeriatria', category: 'Terceira Idade' },
    { id: 14, name: 'Odontologia do Esporte', category: 'Atletas' },
    { id: 15, name: 'Odontologia para Pacientes Especiais', category: 'Cuidados Especiais' },
    { id: 16, name: 'Ortopedia Funcional dos Maxilares', category: 'Ortopedia' },
  ];

  // Especialidades selecionadas inicialmente (ex: Implantodontia #3 e Ortodontia #8)
  selectedSpecialties: SpecialtyItem[] = [
    { id: 3, name: 'Implantodontia' },
    { id: 8, name: 'Ortodontia' },
  ];

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(s => ({
    ...s,
    current: s.id === 2,
    completed: s.id <= 2,
  }));

  constructor(private router: Router) {}

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
  }

  removeSpecialty(specialty: SpecialtyItem): void {
    this.selectedSpecialties = this.selectedSpecialties.filter(s => s.id !== specialty.id);
  }

  recommendByAi(): void {
    // Sugestão inteligente de especialidades com alta procura
    const aiSuggestedIds = [2, 3, 7, 8, 10]; // Dentística, Implantodontia, Periodontia, Ortodontia, Harmonização
    const suggestions = this.availableSpecialties.filter(s => aiSuggestedIds.includes(s.id));
    this.selectedSpecialties = suggestions.map(s => ({ id: s.id, name: s.name }));
  }

  selectAll(): void {
    this.selectedSpecialties = this.availableSpecialties.map(s => ({ id: s.id, name: s.name }));
  }

  clearAll(): void {
    this.selectedSpecialties = [];
  }

  getPayload(): ClientSpecialtiesConfig {
    return {
      clientUuid: this.clientUuid,
      specialties: this.selectedSpecialties,
    };
  }

  goBack(): void {
    this.router.navigate(['/wizard-step-1-aboult']);
  }

  goNext(): void {
    this.router.navigate(['/wizard-step-3-services']);
  }

  activateService(): void {
    // Ativar atendimento
  }
}
