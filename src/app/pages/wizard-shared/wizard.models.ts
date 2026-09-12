export interface WizardStep {
  id: number;
  label: string;
  sublabel: string;
  icon: string;
  completed: boolean;
  current: boolean;
}

export const WIZARD_STEPS_DEFAULT: WizardStep[] = [
  { id: 1, label: 'Sobre a clínica', sublabel: 'Informações básicas', icon: 'pi pi-user', completed: true, current: false },
  { id: 2, label: 'Especialidade', sublabel: 'Especialidades e áreas de atuação', icon: 'pi pi-star', completed: false, current: false },
  { id: 3, label: 'Serviços', sublabel: 'Cadastre seus serviços e preços', icon: 'pi pi-compass', completed: false, current: false },
  { id: 4, label: 'Horários', sublabel: 'Defina dias e horários de atendimento', icon: 'pi pi-clock', completed: false, current: false },
  { id: 5, label: 'Equipe', sublabel: 'Convide sua equipe e defina funções', icon: 'pi pi-users', completed: false, current: false },
  { id: 6, label: 'WhatsApp', sublabel: 'Conecte e configure seu WhatsApp', icon: 'pi pi-whatsapp', completed: false, current: false },
  { id: 7, label: 'IA', sublabel: 'Ative a IA para otimizar atendimentos', icon: 'pi pi-sparkles', completed: false, current: false },
  { id: 8, label: 'Revisar', sublabel: 'Revise e ative sua clínica', icon: 'pi pi-check-circle', completed: false, current: false },
];
