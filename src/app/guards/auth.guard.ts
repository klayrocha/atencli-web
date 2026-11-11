import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionJourneyService } from '../pages/subscription/subscription-journey.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const journey = inject(SubscriptionJourneyService);
  const choice = journey.capture(route.queryParamMap) ?? journey.read();

  if (!auth.isAuthenticated()) return true;
  if (choice) return router.createUrlTree(['/subscription'], { queryParams: choice });
  return router.createUrlTree(['/']);
};
