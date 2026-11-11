import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

const GUIDANCE: Record<string, { title: string; text: string; guide: string }> = {
  'wizard-step-1-aboult': { title: 'Vamos conhecer sua clínica?', text: 'Confira os dados da clínica e complete as informações de contato. Eles ajudam a personalizar o atendimento aos seus pacientes.', guide: 'primeiros-passos' },
  'wizard-step-2-specialty': { title: 'Sua área de atuação', text: 'Selecione as especialidades da sua clínica para receber sugestões de serviços adequadas ao seu atendimento.', guide: 'primeiros-passos' },
  'wizard-step-3-services': { title: 'Serviços do seu jeito', text: 'Revise os serviços sugeridos para suas especialidades. Confira os preços e a duração de cada atendimento antes de continuar.', guide: 'servicos' },
  'wizard-step-4-schedule': { title: 'Vamos conferir os horários?', text: 'Confira os dias, horários e intervalos de atendimento. Ajuste o que precisar para que a agenda acompanhe a rotina da sua clínica.', guide: 'horarios' },
  'wizard-step-5-team': { title: 'Sua equipe por perto', text: 'Convide quem vai usar o Atenclin e escolha as permissões de cada pessoa. Confira os e-mails antes de enviar os convites.', guide: 'equipe' },
  'wizard-step-6-professionals': { title: 'Quem realiza os atendimentos?', text: 'Cadastre os profissionais e associe os serviços que cada um oferece para organizar os agendamentos.', guide: 'primeiros-passos' },
  'wizard-step-6-whatsapp': { title: 'Conecte seu WhatsApp', text: 'Conecte o número da clínica e confira as mensagens de atendimento. A conexão precisa da sua autorização para ser concluída.', guide: 'whatsapp' },
  'wizard-step-7-instagram': { title: 'Seu Instagram conectado', text: 'Conecte a conta profissional da clínica e autorize o acesso às mensagens para centralizar os atendimentos.', guide: 'instagram' },
  ia: { title: 'Uma ajuda para atender melhor', text: 'Revise o tom de voz e as mensagens sugeridas para que a inteligência artificial atenda com a personalidade da sua clínica.', guide: 'inteligencia-artificial' },
  'wizard-step-9-review': { title: 'Tudo pronto para revisar', text: 'Confira o resumo das configurações. Você pode voltar às etapas e ajustar os detalhes antes de ativar o atendimento.', guide: 'primeiros-passos' },
};
GUIDANCE['configuracoes/whatsapp'] = GUIDANCE['wizard-step-6-whatsapp'];
GUIDANCE['configuracoes/instagram'] = GUIDANCE['wizard-step-7-instagram'];
GUIDANCE['integracoes/instagram/callback'] = GUIDANCE['wizard-step-7-instagram'];

@Component({
  selector: 'app-wizard-assistant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wizard-assistant.component.html',
  styleUrl: './wizard-assistant.component.scss',
})
export class WizardAssistantComponent {
  private readonly router = inject(Router);
  readonly guidance = signal(this.forUrl(this.router.url));
  readonly expanded = signal(true);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.guidance.set(this.forUrl(event.urlAfterRedirects));
        this.expanded.set(true);
      }
    });
  }

  private forUrl(url: string) {
    return GUIDANCE[url.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '')];
  }
}
