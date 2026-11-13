import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

const GUIDANCE: Record<string, { title: string; text: string; guide: string }> = {
  'wizard-step-1-aboult': { title: 'Vamos conhecer sua clínica?', text: 'Comece pelo nome, localização e contatos da clínica. São informações simples que ajudam seus clientes a conhecer o seu atendimento.', guide: 'primeiros-passos' },
  'wizard-step-2-specialty': { title: 'Sua área de atuação', text: 'Marque as especialidades que sua clínica atende. Você pode escolher mais de uma; elas ajudam a encontrar os serviços da próxima etapa.', guide: 'primeiros-passos' },
  'wizard-step-3-services': { title: 'Serviços do seu jeito', text: 'Escolha os serviços oferecidos e informe o preço e a duração de cada um. Use a busca para encontrar o que precisa e habilite apenas o que sua clínica atende.', guide: 'servicos' },
  'wizard-step-4-schedule': { title: 'Seus horários já têm um ponto de partida!', text: 'Preparamos uma rotina sugerida para você não começar do zero. Confira os dias, horários e pausas, ajuste o que precisar e salve. Se você já configurou sua agenda, seus horários foram mantidos.', guide: 'horarios' },
  'wizard-step-5-team': { title: 'Sua equipe por perto', text: 'Adicione o e-mail de quem vai usar o Atenclin e escolha o acesso de cada pessoa. O convite chega por e-mail para que ela entre na sua equipe.', guide: 'equipe' },
  'wizard-step-6-professionals': { title: 'Quem realiza os atendimentos?', text: 'Informe quem realiza as consultas e quais serviços cada profissional oferece. Isso ajuda a direcionar cada agendamento para a pessoa certa.', guide: 'primeiros-passos' },
  'wizard-step-6-whatsapp': { title: 'Conecte seu WhatsApp', text: 'Clique em conectar e siga os passos da Meta para autorizar o WhatsApp Business da clínica. Ao voltar, confira se a conexão foi concluída.', guide: 'whatsapp' },
  'wizard-step-7-instagram': { title: 'Seu Instagram conectado', text: 'Autorize a conexão pela Meta e escolha o Instagram profissional da clínica. Depois, você poderá acompanhar as mensagens pelo Atenclin.', guide: 'instagram' },
  ia: { title: 'A Atenclin pensou em você! ✨', text: 'Reunimos as melhores práticas e já deixamos a IA configurada para facilitar sua vida. Quer dar o seu toque? Ajuste as mensagens e o jeito de falar conforme a sua preferência!', guide: 'inteligencia-artificial' },
  'wizard-step-9-review': { title: 'Tudo pronto para revisar', text: 'Veja o resumo do que você preencheu. Se precisar corrigir algo, abra a etapa correspondente e faça o ajuste antes de ativar o atendimento.', guide: 'primeiros-passos' },
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
  readonly expanded = signal(false);
  private focused = false;

  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.expanded.set(true);
  }

  onPointerLeave(): void {
    if (!this.focused) this.expanded.set(false);
  }

  onFocusIn(): void {
    this.focused = true;
    this.expanded.set(true);
  }

  onFocusOut(event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && container.contains(event.relatedTarget)) return;
    this.focused = false;
    this.expanded.set(false);
  }

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.guidance.set(this.forUrl(event.urlAfterRedirects));
        this.expanded.set(false);
        this.focused = false;
      }
    });
  }

  private forUrl(url: string) {
    return GUIDANCE[url.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '')];
  }
}
