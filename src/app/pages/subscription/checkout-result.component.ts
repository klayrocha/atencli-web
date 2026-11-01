import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, SubscriptionService } from './subscription.service';

type ResultState = 'confirming' | 'confirmed' | 'processing' | 'canceled';
const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 10;

/**
 * Retorno do checkout da Stripe. O retorno do navegador não confirma o pagamento: a página consulta o backend
 * até o webhook invoice.paid liberar o acesso.
 */
@Component({
  selector: 'app-checkout-result', standalone: true, imports: [CommonModule, RouterLink],
  template: `
    <section class="result-page">
      <article class="result-card" [attr.data-state]="state">
        <span class="result-icon"><i class="pi" aria-hidden="true" [ngClass]="{
          'pi-spin pi-spinner': state === 'confirming',
          'pi-check': state === 'confirmed',
          'pi-clock': state === 'processing',
          'pi-info-circle': state === 'canceled' }"></i></span>
        <ng-container [ngSwitch]="state">
          <ng-container *ngSwitchCase="'confirming'">
            <h1>Confirmando pagamento…</h1>
            <p>Estamos aguardando a confirmação da Stripe. Isso costuma levar poucos segundos.</p>
          </ng-container>
          <ng-container *ngSwitchCase="'confirmed'">
            <h1>Assinatura ativa</h1>
            <p>Pagamento confirmado. O plano {{ subscription?.plan?.name }} já está liberado para a clínica.</p>
          </ng-container>
          <ng-container *ngSwitchCase="'processing'">
            <h1>Pagamento em processamento</h1>
            <p>A Stripe ainda não confirmou o pagamento. Assim que a confirmação chegar, o plano será liberado automaticamente. Você pode acompanhar o status na página Assinatura.</p>
          </ng-container>
          <ng-container *ngSwitchCase="'canceled'">
            <h1>Pagamento não concluído</h1>
            <p>O checkout foi cancelado e nada foi cobrado. Você pode escolher um plano e tentar novamente quando quiser.</p>
          </ng-container>
        </ng-container>
        <div class="result-actions" *ngIf="state !== 'confirming'">
          <a routerLink="/subscription" class="button primary">Ver assinatura</a>
          <a routerLink="/" class="button" *ngIf="state === 'confirmed'">Ir para o início</a>
        </div>
      </article>
    </section>
  `,
  styles: [`
    :host { display: block; --ink: #202a3a; --muted: #737b89; }
    .result-page { min-height: 70vh; display: grid; place-items: center; color: var(--ink); }
    .result-card { max-width: 520px; text-align: center; background: #ffffffed; border-radius: 22px; padding: 40px 32px; box-shadow: 0 10px 40px #18251c12; }
    .result-icon { width: 68px; height: 68px; margin: 0 auto 18px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(130deg,#ebf3e9,#f6f9df); color: #699c78; i { font-size: 28px; } }
    [data-state=processing] .result-icon { background: #fff4e5; color: #d08a2b; }
    [data-state=canceled] .result-icon { background: #f1f3f5; color: var(--muted); }
    h1 { margin: 0; font-size: 26px; font-weight: 650; letter-spacing: -.5px; }
    p { margin: 12px 0 0; color: var(--muted); font-size: 14px; line-height: 1.6; }
    .result-actions { display: flex; gap: 10px; justify-content: center; margin-top: 26px; flex-wrap: wrap; }
    .button { font: inherit; font-size: 13px; color: inherit; text-decoration: none; border: 1px solid #edf0f1; background: white; border-radius: 9px; padding: 11px 16px; &:hover { background: #f3f7e8; } &:focus-visible { outline: 2px solid #77964c; outline-offset: 3px; } }
    .primary { background: #d6e979; border-color: #d6e979; font-weight: 600; color: #364626; &:hover { background: #cbe06a; } }
  `]
})
export class CheckoutResultComponent implements OnInit, OnDestroy {
  state: ResultState = 'confirming';
  subscription: Subscription | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;

  constructor(private route: ActivatedRoute, private api: SubscriptionService) {}

  ngOnInit() {
    if (this.route.snapshot.data['result'] === 'canceled') { this.state = 'canceled'; return; }
    void this.poll();
  }
  ngOnDestroy() { if (this.timer) clearTimeout(this.timer); }

  private async poll() {
    this.attempts++;
    try {
      this.subscription = await this.api.current();
      if (this.subscription.hasAccess) { this.state = 'confirmed'; return; }
    } catch {
      // Falha transitória: tenta novamente até o limite.
    }
    if (this.attempts >= MAX_ATTEMPTS) { this.state = 'processing'; return; }
    this.timer = setTimeout(() => void this.poll(), POLL_INTERVAL_MS);
  }
}
