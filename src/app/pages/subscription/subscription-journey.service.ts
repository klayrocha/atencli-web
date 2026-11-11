import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';
import type { BillingInterval, PlanCode } from './subscription.service';

export interface SubscriptionChoice { plan: PlanCode; billing: BillingInterval; }
const KEY = 'atenclin_subscription_choice';
const TTL = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SubscriptionJourneyService {
  readonly names: Record<PlanCode, string> = { STARTER: 'Starter', PROFESSIONAL: 'Profissional', PLUS: 'Plus' };

  private valid(value: any): value is SubscriptionChoice {
    return !!value && ['STARTER', 'PROFESSIONAL', 'PLUS'].includes(value.plan)
      && ['MONTHLY', 'YEARLY'].includes(value.billing);
  }

  capture(params: ParamMap): SubscriptionChoice | null {
    const choice = { plan: params.get('plan'), billing: params.get('billing') };
    if (!this.valid(choice)) return null;
    try { localStorage.setItem(KEY, JSON.stringify({ ...choice, expires: Date.now() + TTL })); } catch { /* Storage may be unavailable. */ }
    return choice;
  }

  read(): SubscriptionChoice | null {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      const expires = value?.expires;
      if (this.valid(value) && typeof expires === 'number' && expires > Date.now()) {
        return { plan: value.plan, billing: value.billing };
      }
    } catch { /* Ignore invalid or unavailable storage. */ }
    return null;
  }

  clear(): void { try { localStorage.removeItem(KEY); } catch { /* Ignore unavailable storage. */ } }
}
