import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { settingsEntryGuard } from './settings-entry.guard';

describe('Settings entry guard', () => {
  const key = 'atenclin:onboarding:settings-guard-test';
  beforeEach(() => {
    localStorage.removeItem(key);
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: AuthService, useValue: {
        currentProfile: signal({ clientUuid: 'settings-guard-test' }), currentUser: () => null,
      } },
    ] });
  });
  afterEach(() => localStorage.removeItem(key));
  function enter(params: Record<string, string> = { source: 'menu' }) {
    return TestBed.runInInjectionContext(() => settingsEntryGuard(
      { queryParamMap: convertToParamMap(params) } as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    ));
  }
  for (const progress of [0, 4, 8]) {
    it(`redirects incomplete progress ${progress} to the first step`, () => {
      localStorage.setItem(key, String(progress));
      expect(TestBed.inject(Router).serializeUrl(enter() as UrlTree)).toBe('/wizard-step-1-aboult');
    });
  }
  it('allows completed configuration on direct entry before effects run', () => {
    localStorage.setItem(key, '9');
    expect(enter()).toBeTrue();
  });
  it('allows normal onboarding to reach the completion page', () => {
    expect(enter({})).toBeTrue();
  });
});
