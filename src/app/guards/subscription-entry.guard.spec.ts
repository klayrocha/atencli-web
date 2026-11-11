import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionJourneyService } from '../pages/subscription/subscription-journey.service';
import { guestGuard } from './auth.guard';

describe('Site plan entry', () => {
  let authenticated: boolean;
  beforeEach(() => {
    authenticated = false;
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated: () => authenticated } }] });
    TestBed.inject(SubscriptionJourneyService).clear();
  });
  afterEach(() => TestBed.inject(SubscriptionJourneyService).clear());
  function enter(params: Record<string, string>) {
    return TestBed.runInInjectionContext(() => guestGuard({ queryParamMap: convertToParamMap(params) } as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  }
  it('lets a new visitor register and remembers the site choice', () => {
    expect(enter({ plan: 'STARTER', billing: 'YEARLY' })).toBeTrue();
    expect(TestBed.inject(SubscriptionJourneyService).read()).toEqual({ plan: 'STARTER', billing: 'YEARLY' });
  });
  it('takes a signed-in visitor directly to subscription review', () => {
    authenticated = true;
    const result = enter({ plan: 'PLUS', billing: 'MONTHLY' });
    expect(TestBed.inject(Router).serializeUrl(result as any)).toBe('/subscription?plan=PLUS&billing=MONTHLY');
  });
  it('preserves the default destination outside the purchase journey', () => {
    authenticated = true;
    expect(TestBed.inject(Router).serializeUrl(enter({}) as any)).toBe('/');
  });
});
