import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../auth/auth.service';
import { SubscriptionComponent } from './subscription.component';
import { BillingInterval, PlanCode, Subscription, SubscriptionPlan, SubscriptionService } from './subscription.service';

const plan = (code: PlanCode, monthlyPriceCents: number, yearlyPriceCents: number): SubscriptionPlan => ({
  code, name: code, monthlyPriceCents, yearlyPriceCents, maxUsers: 2, monthlyAiMessages: 3000,
  instagramEnabled: true, followUpEnabled: true, metaTemplatesEnabled: true, supportLevel: 'STANDARD',
});
const starter = plan('STARTER', 36900, 376380);
const professional = plan('PROFESSIONAL', 49900, 508980);
const plus = plan('PLUS', 79900, 814980);

function active(current: SubscriptionPlan, billingInterval: BillingInterval): Subscription {
  return {
    status: 'ACTIVE', plan: current, billingInterval, hasAccess: true, currentPeriodStart: null, currentPeriodEnd: null,
    paidUntil: null, accessUntil: null, cancelAtPeriodEnd: false, pendingInvoiceUrl: null,
    aiMessagesUsedInCycle: 0, aiUsageCycleStart: null, aiUsageCycleEnd: null,
  };
}

describe('SubscriptionComponent yearly plans', () => {
  let component: SubscriptionComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { currentProfile: () => null } }] });
    component = TestBed.runInInjectionContext(() => new SubscriptionComponent({} as SubscriptionService));
    component.plans = [starter, professional, plus];
  });

  it('shows the yearly total, monthly equivalent and savings of each plan', () => {
    expect(component.yearly(starter)).toEqual({ total: 376380, perMonth: 31365, savings: 66420 });
    expect(component.yearly(professional)).toEqual({ total: 508980, perMonth: 42415, savings: 89820 });
    expect(component.yearly(plus)).toEqual({ total: 814980, perMonth: 67915, savings: 143820 });
    expect(component.maxYearlySavingsPercent).toBe(15);
  });

  it('offers monthly subscribers the same or a higher plan on yearly billing', () => {
    component.subscription = active(professional, 'MONTHLY');
    component.interval = 'MONTHLY';
    expect(component.isUpgrade(professional)).toBeFalse();
    expect(component.isUpgrade(plus)).toBeTrue();
    component.interval = 'YEARLY';
    expect(component.isUpgrade(starter)).toBeFalse();
    expect(component.isUpgrade(professional)).toBeTrue();
    expect(component.isUpgrade(plus)).toBeTrue();
  });

  it('never offers yearly subscribers a move back to monthly', () => {
    component.subscription = active(starter, 'YEARLY');
    component.interval = 'MONTHLY';
    expect(component.isUpgrade(plus)).toBeFalse();
    expect(component.blocksMonthlyFromYearly).toBeTrue();
    component.interval = 'YEARLY';
    expect(component.isCurrent(starter)).toBeTrue();
    expect(component.isUpgrade(professional)).toBeTrue();
  });

  it('hides yearly billing when the backend does not send yearly prices', () => {
    component.plans = [{ ...starter, yearlyPriceCents: undefined as unknown as number }, professional, plus];
    component.interval = 'YEARLY';
    expect(component.hasYearlyPrices).toBeFalse();
    expect(component.isYearlyView).toBeFalse();
    expect(component.maxYearlySavingsPercent).toBe(0);
  });
  it('shows the running trial without a payment to manage and offers checkout', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { currentProfile: () => ({ roles: ['ADMIN'] }) } }] });
    component = TestBed.runInInjectionContext(() => new SubscriptionComponent({} as SubscriptionService));
    component.plans = [starter, professional, plus];
    const trialEndsAt = new Date(Date.now() + 2.5 * 86_400_000).toISOString();
    component.subscription = { ...active(professional, 'MONTHLY'), status: 'TRIALING', trialEndsAt };
    expect(component.statusKey).toBe('TRIALING');
    expect(component.trialDaysLeft).toBe(3);
    expect(component.canManagePayment).toBeFalse();
    expect(component.hasLiveSubscription).toBeFalse();
    expect(component.isCurrent(professional)).toBeFalse();
    expect(component.isUpgrade(plus)).toBeFalse();
  });

  it('treats an ended trial as no access', () => {
    component.subscription = {
      ...active(professional, 'MONTHLY'), status: 'TRIALING', hasAccess: false,
      trialEndsAt: new Date(Date.now() - 1000).toISOString(),
    };
    expect(component.statusKey).toBe('TRIAL_EXPIRED');
    expect(component.trialDaysLeft).toBe(0);
    expect(component.aiUsage).toBeNull();
  });

});
