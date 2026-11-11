import { convertToParamMap } from '@angular/router';
import { SubscriptionJourneyService } from './subscription-journey.service';

describe('Subscription journey selection', () => {
  const service = new SubscriptionJourneyService();
  beforeEach(() => service.clear());
  afterEach(() => service.clear());

  it('preserves the chosen plan and billing across authentication redirects', () => {
    service.capture(convertToParamMap({ plan: 'PROFESSIONAL', billing: 'YEARLY' }));
    expect(new SubscriptionJourneyService().read()).toEqual({ plan: 'PROFESSIONAL', billing: 'YEARLY' });
  });

  it('rejects arbitrary destinations and unknown plans or billing periods', () => {
    expect(service.capture(convertToParamMap({ plan: 'https://example.com', billing: 'YEARLY' }))).toBeNull();
    expect(service.capture(convertToParamMap({ plan: 'STARTER', billing: 'FREE' }))).toBeNull();
    expect(service.read()).toBeNull();
  });

  it('expires the choice after 24 hours', () => {
    service.capture(convertToParamMap({ plan: 'PLUS', billing: 'MONTHLY' }));
    const now = Date.now();
    spyOn(Date, 'now').and.returnValue(now + 24 * 60 * 60 * 1000 + 1);
    expect(service.read()).toBeNull();
  });
});
