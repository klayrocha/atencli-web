import { Injectable, computed, effect, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

export const ONBOARDING_ROUTES = [
  '/wizard-step-1-aboult', '/wizard-step-2-specialty', '/wizard-step-3-services',
  '/wizard-step-4-schedule', '/wizard-step-5-team', '/wizard-step-6-professionals', '/wizard-step-6-whatsapp',
  '/wizard-step-7-instagram', '/ia', '/wizard-step-9-review',
];

@Injectable({ providedIn: 'root' })
export class OnboardingProgressService {
  readonly completedSteps = signal(0);
  readonly started = computed(() => this.completedSteps() > 0);
  readonly complete = computed(() => this.completedSteps() === ONBOARDING_ROUTES.length);
  readonly resumeRoute = computed(() => ONBOARDING_ROUTES[Math.min(this.completedSteps(), ONBOARDING_ROUTES.length - 1)]);
  private previousRoute = '';
  private activeKey: string | null = null;

  constructor(private auth: AuthService, router: Router) {
    effect(() => {
      const key = this.storageKey();
      if (key !== this.activeKey) {
        this.activeKey = key;
        this.previousRoute = '';
        this.completedSteps.set(this.read(key));
      }
    }, { allowSignalWrites: true });
    router.events.subscribe(event => {
      if (!(event instanceof NavigationEnd)) return;
      const key = this.storageKey();
      if (key !== this.activeKey) {
        this.activeKey = key;
        this.completedSteps.set(this.read(key));
        this.previousRoute = '';
      }
      const route = event.urlAfterRedirects.split(/[?#]/)[0];
      const from = ONBOARDING_ROUTES.indexOf(this.previousRoute);
      const to = ONBOARDING_ROUTES.indexOf(route);
      // Only successful forward transitions count. Opening Settings is not completion.
      if (from >= 0 && to === from + 1 && new URLSearchParams(event.urlAfterRedirects.split('?')[1]?.split('#')[0]).get('source') !== 'menu') this.advance(to === ONBOARDING_ROUTES.length - 1 ? ONBOARDING_ROUTES.length : to);
      this.previousRoute = route;
    });
  }

  isConfigurationComplete(): boolean {
    const key = this.storageKey();
    return (key === this.activeKey ? this.completedSteps() : this.read(key)) === ONBOARDING_ROUTES.length;
  }

  advance(completed: number): void {
    const key = this.storageKey();
    if (!key) return;
    const value = Math.max(this.read(key), key === this.activeKey ? this.completedSteps() : 0, completed);
    this.activeKey = key;
    this.completedSteps.set(value);
    try { localStorage.setItem(key, String(value)); } catch { /* Keep the current session usable if storage is unavailable. */ }
  }

  private storageKey(): string | null {
    const id = this.auth.currentProfile()?.clientUuid ?? this.auth.currentUser()?.id;
    return id ? `atenclin:onboarding:v2:${id}` : null;
  }
  private read(key: string | null): number {
    if (!key) return 0;
    try {
      const stored = localStorage.getItem(key);
      // Earlier progress cannot mark the new professional step as completed.
      const legacy = Number(localStorage.getItem(key.replace('onboarding:v2:', 'onboarding:')));
      const value = stored === null ? Math.min(Number.isInteger(legacy) ? legacy : 0, 5) : Number(stored);
      return Number.isInteger(value) && value >= 0 && value <= ONBOARDING_ROUTES.length ? value : 0;
    } catch { return 0; }
  }
}
