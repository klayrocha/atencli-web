import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment.development';

export type PlanCode = 'STARTER' | 'PROFESSIONAL' | 'PLUS';
/** TRIALING: teste grátis de 5 dias do plano Profissional, concedido no cadastro, sem cartão. */
export type SubscriptionStatus = 'PENDING' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';
export type BillingInterval = 'MONTHLY' | 'YEARLY';
export interface SubscriptionPlan {
  code: PlanCode;
  name: string;
  monthlyPriceCents: number;
  /** Cobrado de uma vez por ano (15% abaixo de 12 mensalidades). */
  yearlyPriceCents: number;
  maxUsers: number;
  monthlyAiMessages: number;
  instagramEnabled: boolean;
  followUpEnabled: boolean;
  metaTemplatesEnabled: boolean;
  supportLevel: 'STANDARD' | 'PRIORITY' | 'ONBOARDING_PRIORITY' | string;
}
export interface Subscription {
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  billingInterval: BillingInterval | null;
  hasAccess: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  paidUntil: string | null;
  accessUntil: string | null;
  /** Fim do teste grátis; null para clínicas que não tiveram teste. */
  trialEndsAt?: string | null;
  cancelAtPeriodEnd: boolean;
  pendingInvoiceUrl: string | null;
  /** Mensagens de IA usadas no ciclo atual; a cota renova todo mês no dia do pagamento. */
  aiMessagesUsedInCycle: number;
  /** Datas (AAAA-MM-DD, horário de Brasília): início do ciclo e dia em que a cota renova. */
  aiUsageCycleStart: string | null;
  aiUsageCycleEnd: string | null;
}
interface RedirectUrl { url: string; }

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/subscription`;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private get options() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }
  plans() { return firstValueFrom(this.http.get<SubscriptionPlan[]>(`${this.url}/plans`, this.options)); }
  current() { return firstValueFrom(this.http.get<Subscription>(this.url, this.options)); }
  /** Plano superior no mesmo ciclo, ou mudança de mensal para anual. */
  upgrade(plan: PlanCode, interval: BillingInterval) {
    return firstValueFrom(this.http.post<Subscription>(`${this.url}/upgrade`, { plan, interval }, this.options));
  }
  /** O pagamento acontece na página da Stripe; o acesso só é liberado quando o backend recebe a confirmação. */
  async redirectToCheckout(plan: PlanCode, interval: BillingInterval) {
    const response = await firstValueFrom(this.http.post<RedirectUrl>(`${this.url}/checkout`, { plan, interval }, this.options));
    window.location.href = response.url;
  }
  async redirectToPortal() {
    const response = await firstValueFrom(this.http.post<RedirectUrl>(`${this.url}/portal`, {}, this.options));
    window.location.href = response.url;
  }
}

export function subscriptionErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const message: string = error.error?.message ?? '';
  if (error.status === 403) return 'Somente o administrador da clínica pode alterar a assinatura.';
  if (error.status === 409) return 'A clínica já possui uma assinatura. Use o upgrade ou gerencie o pagamento.';
  if (error.status === 502) return 'O serviço de pagamento está indisponível no momento. Tente novamente em instantes.';
  if (message.includes('Upgrade payment was not approved')) return 'O pagamento do upgrade não foi aprovado. Atualize a forma de pagamento em "Gerenciar pagamento" e tente novamente.';
  if (message.includes('Only upgrades')) return 'Só é possível mudar para um plano superior.';
  if (message.includes('yearly to monthly')) return 'Não é possível trocar a assinatura anual pela mensal.';
  if (message.includes('Only active subscriptions')) return 'O upgrade só está disponível para assinaturas ativas. Regularize o pagamento primeiro.';
  return fallback;
}
