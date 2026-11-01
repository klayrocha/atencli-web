import { TestBed } from '@angular/core/testing';
import { PlanAccessService } from './plan-access.service';
import { Subscription, SubscriptionPlan, SubscriptionService } from './subscription.service';

const starter: SubscriptionPlan = {
  code: 'STARTER', name: 'Starter', monthlyPriceCents: 36900, yearlyPriceCents: 376380, maxUsers: 2, monthlyAiMessages: 3000,
  instagramEnabled: false, followUpEnabled: false, metaTemplatesEnabled: false, supportLevel: 'STANDARD',
};

function subscription(overrides: Partial<Subscription>): Subscription {
  return {
    status: 'ACTIVE', plan: starter, billingInterval: 'MONTHLY', hasAccess: true, currentPeriodStart: null, currentPeriodEnd: null,
    paidUntil: null, accessUntil: null, cancelAtPeriodEnd: false, pendingInvoiceUrl: null,
    aiMessagesUsedInCycle: 0, aiUsageCycleStart: null, aiUsageCycleEnd: null, ...overrides,
  };
}

describe('PlanAccessService', () => {
  let current: jasmine.Spy;
  let service: PlanAccessService;

  beforeEach(() => {
    current = jasmine.createSpy('current');
    TestBed.configureTestingModule({ providers: [{ provide: SubscriptionService, useValue: { current } }] });
    service = TestBed.inject(PlanAccessService);
  });

  it('blocks nothing while the subscription is unknown', async () => {
    current.and.rejectWith(new Error('offline'));
    await service.load();
    expect(service.lockMessage('INSTAGRAM')).toBeNull();
    expect(service.userLimit()).toBe(Number.POSITIVE_INFINITY);
  });

  it('locks paid features on Starter but keeps the subscription usable', async () => {
    current.and.resolveTo(subscription({}));
    await service.load();
    expect(service.lockMessage()).toBeNull();
    expect(service.lockMessage('INSTAGRAM')).toContain('Profissional e Plus');
    expect(service.userLimit()).toBe(2);
  });

  it('locks everything and allows only the owner without access', async () => {
    current.and.resolveTo(subscription({ status: 'SUSPENDED', hasAccess: false }));
    await service.load();
    expect(service.lockMessage()).toContain('assinatura ativa');
    expect(service.allows('AUTOMATIC_FOLLOW_UP')).toBeFalse();
    expect(service.userLimit()).toBe(1);
  });
});
