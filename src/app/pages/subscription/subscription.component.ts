import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionChoice, SubscriptionJourneyService } from './subscription-journey.service';
import { BillingInterval, PlanCode, Subscription, SubscriptionPlan, SubscriptionService, SubscriptionStatus, subscriptionErrorMessage } from './subscription.service';

const PLAN_ORDER: PlanCode[] = ['STARTER', 'PROFESSIONAL', 'PLUS'];
/** Estados em que já existe assinatura na Stripe: não se cria outro checkout. */
const LIVE_STATUSES: SubscriptionStatus[] = ['ACTIVE', 'PAST_DUE', 'SUSPENDED'];

@Component({
  selector: 'app-subscription', standalone: true, imports: [CommonModule],
  templateUrl: './subscription.component.html', styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent implements OnInit {
  private readonly journey = inject(SubscriptionJourneyService);
  private readonly route = inject(ActivatedRoute, { optional: true });
  requestedChoice: SubscriptionChoice | null = null;
  readonly planNames = this.journey.names;
  @ViewChild('upgradeDialog', { static: true }) upgradeDialog!: ElementRef<HTMLDialogElement>;
  readonly statusLabels: Record<SubscriptionStatus | 'TRIAL_EXPIRED', string> = {
    PENDING: 'Aguardando pagamento', TRIALING: 'Teste grátis', TRIAL_EXPIRED: 'Teste encerrado', ACTIVE: 'Ativa',
    PAST_DUE: 'Pagamento pendente', SUSPENDED: 'Suspensa', CANCELED: 'Cancelada'
  };
  readonly supportLabels: Record<string, string> = {
    STANDARD: 'Suporte padrão', PRIORITY: 'Suporte prioritário', ONBOARDING_PRIORITY: 'Onboarding + suporte prioritário'
  };
  private readonly auth = inject(AuthService);
  readonly isAdmin = computed(() => this.auth.currentProfile()?.roles?.includes('ADMIN') ?? false);
  plans: SubscriptionPlan[] = [];
  subscription: Subscription | null = null;
  loading = true;
  busy = false;
  error = '';
  notice = '';
  upgradeTarget: SubscriptionPlan | null = null;
  /** Ciclo exibido nos cartões; começa no ciclo da assinatura atual. */
  interval: BillingInterval = 'MONTHLY';

  constructor(private api: SubscriptionService) {}
  ngOnInit() {
    this.requestedChoice = (this.route ? this.journey.capture(this.route.snapshot.queryParamMap) : null) ?? this.journey.read();
    if (this.requestedChoice) {
      this.interval = this.requestedChoice.billing;
      this.journey.clear();
    }
    void this.load();
  }

  async load() {
    this.loading = true; this.error = '';
    try {
      const [plans, subscription] = await Promise.all([this.api.plans(), this.api.current()]);
      this.plans = [...plans].sort((a, b) => PLAN_ORDER.indexOf(a.code) - PLAN_ORDER.indexOf(b.code));
      this.subscription = subscription;
      if (this.hasLiveSubscription && subscription.billingInterval) this.interval = subscription.billingInterval;
    } catch {
      this.error = 'Não foi possível carregar a assinatura. Tente novamente.';
    } finally { this.loading = false; }
  }

  get hasLiveSubscription() { return !!this.subscription && LIVE_STATUSES.includes(this.subscription.status); }
  get currentPlanCode() { return this.hasLiveSubscription ? this.subscription?.plan?.code ?? null : null; }
  get currentInterval(): BillingInterval { return this.subscription?.billingInterval ?? 'MONTHLY'; }
  /** Backend sem o preço anual (versão anterior ao plano anual): só o mensal é oferecido. */
  get hasYearlyPrices() { return this.plans.length > 0 && this.plans.every(plan => plan.yearlyPriceCents > 0); }
  get isYearlyView() { return this.interval === 'YEARLY' && this.hasYearlyPrices; }
  /** No teste ainda não existe cliente na Stripe: não há pagamento para gerenciar. */
  get canManagePayment() {
    const status = this.subscription?.status;
    return this.isAdmin() && status !== 'PENDING' && status !== 'TRIALING' && !!this.subscription?.plan;
  }

  get isTrial() { return this.subscription?.status === 'TRIALING'; }
  /** Teste acabou sem pagamento: o backend corta o acesso como o de quem não pagou. */
  get isTrialExpired() { return this.isTrial && !this.subscription?.hasAccess; }
  /** Chave do cartão de status (rótulo, ícone e cor); separa o teste vigente do encerrado. */
  get statusKey(): SubscriptionStatus | 'TRIAL_EXPIRED' | null {
    if (!this.subscription) return null;
    return this.isTrialExpired ? 'TRIAL_EXPIRED' : this.subscription.status;
  }
  /** Dias restantes de teste, arredondados para cima (0 quando acabou). */
  get trialDaysLeft() {
    const end = this.subscription?.trialEndsAt;
    if (!this.isTrial || !end) return 0;
    return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000));
  }

  isCurrent(plan: SubscriptionPlan) { return plan.code === this.currentPlanCode && this.interval === this.currentInterval; }
  /** Mesma regra do backend: plano superior no mesmo ciclo, ou de mensal para anual (mesmo plano ou superior). */
  isUpgrade(plan: SubscriptionPlan) {
    const current = this.currentPlanCode;
    if (!current) return false;
    const rankChange = PLAN_ORDER.indexOf(plan.code) - PLAN_ORDER.indexOf(current);
    if (this.currentInterval === 'YEARLY' && this.interval === 'MONTHLY') return false;
    return this.isIntervalChange ? rankChange >= 0 : rankChange > 0;
  }
  /** Assinante mensal olhando os planos anuais. */
  get isIntervalChange() { return this.currentInterval === 'MONTHLY' && this.interval === 'YEARLY'; }
  get blocksMonthlyFromYearly() { return !!this.currentPlanCode && this.currentInterval === 'YEARLY' && this.interval === 'MONTHLY'; }

  /** Valores do plano no ciclo anual, comparados com 12 mensalidades. */
  yearly(plan: SubscriptionPlan) {
    return {
      total: plan.yearlyPriceCents,
      perMonth: Math.round(plan.yearlyPriceCents / 12),
      savings: plan.monthlyPriceCents * 12 - plan.yearlyPriceCents,
    };
  }
  get maxYearlySavingsPercent() {
    if (!this.hasYearlyPrices) return 0;
    const percents = this.plans.map(plan => 1 - plan.yearlyPriceCents / (plan.monthlyPriceCents * 12));
    return percents.length ? Math.round(Math.max(...percents) * 100) : 0;
  }

  async subscribe(plan: SubscriptionPlan) {
    this.busy = true; this.error = ''; this.notice = '';
    try {
      await this.api.redirectToCheckout(plan.code, this.interval);
    } catch (error) {
      this.error = subscriptionErrorMessage(error, 'Não foi possível iniciar o pagamento. Tente novamente.');
      this.busy = false;
    }
  }

  openUpgrade(plan: SubscriptionPlan) { this.upgradeTarget = plan; this.error = ''; this.upgradeDialog.nativeElement.showModal(); }
  closeUpgrade() { if (!this.busy) { this.upgradeDialog.nativeElement.close(); this.upgradeTarget = null; } }

  async confirmUpgrade() {
    if (!this.upgradeTarget) return;
    const target = this.upgradeTarget;
    this.busy = true; this.error = ''; this.notice = '';
    try {
      const toYearly = this.isIntervalChange;
      this.subscription = await this.api.upgrade(target.code, this.interval);
      this.notice = toYearly
        ? `Assinatura alterada para o plano ${target.name} anual.`
        : `Upgrade para o plano ${target.name} realizado. Os novos limites já estão disponíveis.`;
    } catch (error) {
      this.error = subscriptionErrorMessage(error, 'Não foi possível concluir o upgrade. Tente novamente.');
    } finally {
      this.busy = false;
      this.closeUpgrade();
    }
  }

  async managePayment() {
    this.busy = true; this.error = '';
    try {
      await this.api.redirectToPortal();
    } catch (error) {
      this.error = subscriptionErrorMessage(error, 'Não foi possível abrir o gerenciamento de pagamento.');
      this.busy = false;
    }
  }

  price(cents: number) { return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  number(value: number) { return value.toLocaleString('pt-BR'); }
  date(value: string | null) { return value ? new Date(value).toLocaleDateString('pt-BR') : '—'; }
  /** Datas sem horário (AAAA-MM-DD) não passam por Date, que as leria em UTC e mostraria o dia anterior. */
  localDate(value: string | null) {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  get aiUsage() {
    const subscription = this.subscription;
    if (!subscription?.hasAccess || !subscription.plan) return null;
    const limit = subscription.plan.monthlyAiMessages;
    const used = Math.min(subscription.aiMessagesUsedInCycle ?? 0, limit);
    const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
    return { used, limit, percent, level: percent >= 100 ? 'full' : percent >= 80 ? 'high' : 'normal' };
  }

  features(plan: SubscriptionPlan) {
    return [
      { label: 'WhatsApp', included: true },
      { label: 'Instagram', included: plan.instagramEnabled },
      { label: `${plan.maxUsers} usuários`, included: true },
      { label: 'Google Calendar', included: true },
      { label: 'Conversas e etapas', included: true },
      { label: `IA de atendimento · ${this.number(plan.monthlyAiMessages)} mensagens/mês`, included: true },
      { label: 'Acompanhamento automático', included: plan.followUpEnabled },
      { label: 'Templates Meta fora da janela', included: plan.metaTemplatesEnabled },
      { label: 'Resumo diário', included: true },
      { label: this.supportLabels[plan.supportLevel] ?? plan.supportLevel, included: true },
    ];
  }
}
