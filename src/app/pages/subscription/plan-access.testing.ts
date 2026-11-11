import { TestBed } from '@angular/core/testing';
import { PlanAccessService } from './plan-access.service';

/** Plano sem restrições, para specs que testam outra regra da tela. */
export const unrestrictedPlanAccess = {
  provide: PlanAccessService,
  useValue: {
    load: async () => undefined,
    lockMessage: () => null,
    allows: () => true,
    hasAccess: () => true,
    userLimit: () => Number.POSITIVE_INFINITY,
    trialEndsAt: () => null,
  },
};

/** Cria um componente com `new` dentro de um contexto de injeção que fornece o PlanAccessService. */
export function withPlanAccess<T>(create: () => T): T {
  TestBed.configureTestingModule({ providers: [unrestrictedPlanAccess] });
  return TestBed.runInInjectionContext(create);
}
