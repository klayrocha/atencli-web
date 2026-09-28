import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { OnboardingProgressService } from './onboarding-progress.service';

describe('Onboarding progress', () => {
  let events: Subject<NavigationEnd>;
  let service: OnboardingProgressService;
  const profile = signal({ clientUuid: 'progress-test-a' });
  const navigate = (url: string) => events.next(new NavigationEnd(1, url, url));
  beforeEach(() => {
    localStorage.removeItem('atenclin:onboarding:progress-test-a');
    localStorage.removeItem('atenclin:onboarding:progress-test-b');
    profile.set({ clientUuid: 'progress-test-a' });
    events = new Subject();
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: { events } },
      { provide: AuthService, useValue: { currentProfile: profile, currentUser: () => null } },
    ] });
    service = TestBed.inject(OnboardingProgressService);
    TestBed.flushEffects();
  });
  afterEach(() => {
    localStorage.removeItem('atenclin:onboarding:progress-test-a');
    localStorage.removeItem('atenclin:onboarding:progress-test-b');
  });
  it('starts at step one and resumes after a successful forward navigation', () => {
    expect(service.started()).toBeFalse();
    navigate('/wizard-step-1-aboult');
    navigate('/wizard-step-2-specialty');
    expect(service.started()).toBeTrue();
    expect(service.resumeRoute()).toBe('/wizard-step-2-specialty');
    navigate('/wizard-step-1-aboult');
    expect(service.completedSteps()).toBe(1);
  });
  it('does not mark completion just by opening Settings', () => {
    navigate('/');
    navigate('/wizard-step-8-review');
    expect(service.complete()).toBeFalse();
    navigate('/ia');
    navigate('/wizard-step-8-review?source=menu');
    expect(service.complete()).toBeFalse();
  });
  it('completes after advancing from AI to review and persists by clinic', () => {
    navigate('/ia');
    navigate('/wizard-step-8-review');
    expect(service.complete()).toBeTrue();
    expect(localStorage.getItem('atenclin:onboarding:progress-test-a')).toBe('8');
    profile.set({ clientUuid: 'progress-test-b' });
    TestBed.flushEffects();
    expect(service.started()).toBeFalse();
    profile.set({ clientUuid: 'progress-test-a' });
    TestBed.flushEffects();
    expect(service.complete()).toBeTrue();
  });
});
