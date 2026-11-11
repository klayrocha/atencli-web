import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, SubscriptionService } from './subscription.service';

export type PlanFeature = 'INSTAGRAM' | 'AUTOMATIC_FOLLOW_UP' | 'META_TEMPLATES_OUTSIDE_WINDOW';

export const planLockMessages = {
  subscription: 'Disponível com uma assinatura ativa.',
  INSTAGRAM: 'O Instagram está disponível nos planos Profissional e Plus.',
  AUTOMATIC_FOLLOW_UP: 'O acompanhamento automático está disponível nos planos Profissional e Plus.',
  META_TEMPLATES_OUTSIDE_WINDOW: 'Templates do WhatsApp fora da janela de 24 horas estão disponíveis nos planos Profissional e Plus.',
} as const;

/**
 * Antecipa no frontend as regras de plano que o backend aplica (HTTP 402), para desabilitar ações
 * antes do clique. Se a assinatura não puder ser carregada, nada é bloqueado aqui: o backend continua decidindo.
 */
@Injectable({ providedIn: 'root' })
export class PlanAccessService {
  private readonly api = inject(SubscriptionService);
  private readonly current = signal<Subscription | null>(null);
  private readonly known = signal(false);

  readonly hasAccess = computed(() => !this.known() || (!!this.current()?.hasAccess && !!this.current()?.plan));
  /** Sem plano ativo, só o dono pode usar o sistema. */
  readonly userLimit = computed(() => {
    if (!this.known()) return Number.POSITIVE_INFINITY;
    const subscription = this.current();
    return subscription?.hasAccess && subscription.plan ? subscription.plan.maxUsers : 1;
  });

  /** Fim do teste grátis quando a clínica está (ou esteve) em teste; null fora dele. */
  readonly trialEndsAt = computed(() => {
    const subscription = this.current();
    return subscription?.status === 'TRIALING' ? subscription.trialEndsAt ?? null : null;
  });

  /** Recarrega a cada tela para refletir pagamentos e upgrades recentes. */
  async load(): Promise<void> {
    try {
      this.current.set(await this.api.current());
      this.known.set(true);
    } catch {
      this.known.set(false);
    }
  }

  allows(feature: PlanFeature): boolean {
    if (!this.known()) return true;
    const plan = this.current()?.hasAccess ? this.current()?.plan : null;
    if (!plan) return false;
    switch (feature) {
      case 'INSTAGRAM': return plan.instagramEnabled;
      case 'AUTOMATIC_FOLLOW_UP': return plan.followUpEnabled;
      case 'META_TEMPLATES_OUTSIDE_WINDOW': return plan.metaTemplatesEnabled;
    }
  }

  /** Mensagem do aviso quando o recurso está bloqueado; null quando liberado. */
  lockMessage(feature?: PlanFeature): string | null {
    if (!this.hasAccess()) return planLockMessages.subscription;
    if (feature && !this.allows(feature)) return planLockMessages[feature];
    return null;
  }
}
