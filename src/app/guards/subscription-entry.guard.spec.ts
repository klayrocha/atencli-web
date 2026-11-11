import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { guestGuard } from './auth.guard';

describe('Registration entry without plan routing', () => {
  let authenticated: boolean;
  beforeEach(() => {
    authenticated = false;
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated: () => authenticated } }] });
  });
  function enter() {
    return TestBed.runInInjectionContext(() => guestGuard({ queryParamMap: convertToParamMap({ plan: 'PLUS', billing: 'YEARLY' }) } as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  }
  it('allows new visitors to register even with legacy plan parameters', () => {
    expect(enter()).toBeTrue();
  });
  it('takes authenticated visitors home instead of to checkout', () => {
    authenticated = true;
    expect(TestBed.inject(Router).serializeUrl(enter() as any)).toBe('/');
  });
});
