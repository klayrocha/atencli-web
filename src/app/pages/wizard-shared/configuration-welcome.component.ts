import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';

const MESSAGES = {
  schedule: {
    title: 'Seus horários já têm um ponto de partida!',
    text: 'Preparamos uma rotina sugerida para facilitar o preenchimento. Confira os dias, horários e pausas e ajuste apenas o que for diferente na sua clínica. Depois, é só salvar.',
  },
  ai: {
    title: 'A Atenclin pensou em você! ✨',
    text: 'Para facilitar sua vida, reunimos as melhores práticas e já deixamos a IA configurada para você. Quer dar o seu toque? Fique à vontade para ajustar as mensagens e o jeito de falar conforme a sua preferência!',
  },
};

@Component({
  selector: 'app-configuration-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside *ngIf="visible()" class="welcome" [attr.aria-labelledby]="'configuration-welcome-' + kind">
      <img src="logo.png" alt="Assistente Atenclin" width="80" height="80" />
      <div>
        <h2 [id]="'configuration-welcome-' + kind">{{ message.title }}</h2>
        <p>{{ message.text }}</p>
      </div>
      <button type="button" (click)="visible.set(false)" aria-label="Fechar dica de configuração"><i class="pi pi-times" aria-hidden="true"></i></button>
    </aside>
  `,
  styles: [`
    .welcome { position: relative; display: flex; align-items: center; gap: 20px; padding: 24px 52px 24px 24px; margin-bottom: 24px; border: 1px solid #bef264; border-radius: 18px; background: #f7fee7; animation: configuration-welcome-in .85s ease-out both; }
    img { width: 80px; height: 80px; object-fit: contain; flex-shrink: 0; }
    h2 { margin: 0 0 8px; font-size: 20px; line-height: 1.35; color: #365314; }
    p { margin: 0; font-size: 16px; line-height: 1.65; color: #334155; }
    button { position: absolute; top: 10px; right: 10px; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: #ecfccb; color: #365314; cursor: pointer; }
    button:focus-visible { outline: 3px solid #65a30d; outline-offset: 3px; }
    @keyframes configuration-welcome-in { 0% { opacity: 0; transform: translateY(10px); } 40% { opacity: 1; transform: translateY(0) rotate(-.5deg); } 65% { transform: rotate(.5deg); } 85% { transform: rotate(-.2deg); } 100% { opacity: 1; transform: none; } }
    @media (max-width: 600px) { .welcome { gap: 12px; align-items: flex-start; padding: 20px 42px 20px 16px; } img { width: 48px; height: 48px; } h2 { font-size: 18px; } }
    @media (prefers-reduced-motion: reduce) { .welcome { animation: none; } }
  `],
})
export class ConfigurationWelcomeComponent implements OnInit {
  @Input() kind: 'schedule' | 'ai' = 'schedule';
  get message() { return MESSAGES[this.kind]; }
  private get viewsKey() { return `atenclin:${this.kind === 'ai' ? 'ai' : 'schedule'}-welcome:views:v1`; }
  readonly visible = signal(false);

  ngOnInit(): void {
    let views = 0;
    try {
      const stored = Number(localStorage.getItem(this.viewsKey) ?? 0);
      views = Number.isInteger(stored) && stored >= 0 ? stored : 0;
      if (views < 3) localStorage.setItem(this.viewsKey, String(views + 1));
    } catch { /* A dica continua acessível quando o navegador bloqueia a persistência. */ }
    this.visible.set(views < 3);
  }
}
