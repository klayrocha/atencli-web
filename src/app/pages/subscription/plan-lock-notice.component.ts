import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Aviso exibido ao lado de uma ação desabilitada pelo plano, com atalho para a página de assinatura. */
@Component({
  selector: 'app-plan-lock-notice',
  standalone: true,
  imports: [RouterLink],
  template: `<p class="plan-lock" role="note"><i class="pi pi-lock" aria-hidden="true"></i>
    <span>{{ message }}</span> <a routerLink="/subscription">Ver planos</a></p>`,
  styles: [`
    :host { display: block; }
    .plan-lock { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin: 8px 0 0; padding: 8px 12px;
      border-radius: 10px; background: #fff4e5; color: #9a6418; font-size: 12px; line-height: 1.4; }
    .plan-lock i { font-size: 12px; }
    .plan-lock a { color: #7a4c0e; font-weight: 600; text-decoration: underline; }
  `],
})
export class PlanLockNoticeComponent {
  @Input({ required: true }) message = '';
}
