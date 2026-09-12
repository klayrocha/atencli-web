import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

interface OptionItem {
  label: string;
  value: string;
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
export class WizardStep1AboutComponent {
  // Formulário Step 1
  clinicName = 'Clínica Harmonia';
  clinicType = '';
  shortDescription = '';
  city = '';
  state = '';
  clinicPhone = '';
  clinicEmail = 'contato@clinicaharmonia.com.br';
  acceptsHealthPlan: boolean | null = null;

  clinicTypes: OptionItem[] = [
    { label: 'Clínica Odontológica / Consultório', value: 'odontologia' },
    { label: 'Clínica Médica / Policlínica', value: 'medica' },
    { label: 'Clínica de Estética & Dermatologia', value: 'estetica' },
    { label: 'Clínica de Psicologia & Saúde Mental', value: 'psicologia' },
    { label: 'Clínica de Fisioterapia & Reabilitação', value: 'fisioterapia' },
    { label: 'Clínica Veterinária / Pet Care', value: 'veterinaria' },
    { label: 'Laboratório & Diagnósticos', value: 'laboratorio' },
    { label: 'Outro segmento de saúde', value: 'outro' },
  ];

  states: OptionItem[] = [
    { label: 'Acre (AC)', value: 'AC' },
    { label: 'Alagoas (AL)', value: 'AL' },
    { label: 'Amapá (AP)', value: 'AP' },
    { label: 'Amazonas (AM)', value: 'AM' },
    { label: 'Bahia (BA)', value: 'BA' },
    { label: 'Ceará (CE)', value: 'CE' },
    { label: 'Distrito Federal (DF)', value: 'DF' },
    { label: 'Espírito Santo (ES)', value: 'ES' },
    { label: 'Goiás (GO)', value: 'GO' },
    { label: 'Maranhão (MA)', value: 'MA' },
    { label: 'Mato Grosso (MT)', value: 'MT' },
    { label: 'Mato Grosso do Sul (MS)', value: 'MS' },
    { label: 'Minas Gerais (MG)', value: 'MG' },
    { label: 'Pará (PA)', value: 'PA' },
    { label: 'Paraíba (PB)', value: 'PB' },
    { label: 'Paraná (PR)', value: 'PR' },
    { label: 'Pernambuco (PE)', value: 'PE' },
    { label: 'Piauí (PI)', value: 'PI' },
    { label: 'Rio de Janeiro (RJ)', value: 'RJ' },
    { label: 'Rio Grande do Norte (RN)', value: 'RN' },
    { label: 'Rio Grande do Sul (RS)', value: 'RS' },
    { label: 'Rondônia (RO)', value: 'RO' },
    { label: 'Roraima (RR)', value: 'RR' },
    { label: 'Santa Catarina (SC)', value: 'SC' },
    { label: 'São Paulo (SP)', value: 'SP' },
    { label: 'Sergipe (SE)', value: 'SE' },
    { label: 'Tocantins (TO)', value: 'TO' },
  ];

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(s => ({
    ...s,
    current: s.id === 1,
    completed: s.id === 1,
  }));

  constructor(private router: Router) {}

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

  recommendByAi(): void {
    this.clinicType = 'odontologia';
    this.shortDescription = 'Clínica odontológica moderna focada em implantes, estética e ortodontia de alta performance.';
    this.city = 'São Paulo';
    this.state = 'SP';
    if (!this.clinicPhone) {
      this.clinicPhone = '(11) 99999-9999';
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  goNext(): void {
    this.router.navigate(['/wizard-step-2-specialty']);
  }

  activateService(): void {
    // Ativar atendimento
  }
}
