import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ONBOARDING_ROUTES, OnboardingProgressService } from '../pages/wizard-shared/onboarding-progress.service';

export const settingsEntryGuard: CanActivateFn = route => {
  if (route.queryParamMap.get('source') !== 'menu') return true;
  return inject(OnboardingProgressService).isConfigurationComplete()
    ? true
    : inject(Router).createUrlTree([ONBOARDING_ROUTES[0]]);
};
