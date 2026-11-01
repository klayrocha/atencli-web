import { HttpErrorResponse } from '@angular/common/http';
import { planRestrictionMessage } from './plan-restriction';

function paymentRequired(message: string) {
  return new HttpErrorResponse({ status: 402, error: { message } });
}

describe('planRestrictionMessage', () => {
  it('ignores errors that are not 402', () => {
    expect(planRestrictionMessage(new HttpErrorResponse({ status: 400, error: { message: 'x' } }))).toBeNull();
    expect(planRestrictionMessage(new Error('x'))).toBeNull();
  });

  it('explains which plans include a missing feature', () => {
    expect(planRestrictionMessage(paymentRequired('Current plan does not include INSTAGRAM'))).toContain('Instagram');
    expect(planRestrictionMessage(paymentRequired('Current plan does not include AUTOMATIC_FOLLOW_UP')))
      .toContain('acompanhamento automático');
  });

  it('shows the user limit of the plan', () => {
    expect(planRestrictionMessage(paymentRequired('User limit reached for the current plan (5)'))).toContain('até 5 usuários');
    expect(planRestrictionMessage(paymentRequired('User limit reached for the current plan (1)'))).toContain('apenas o dono');
  });

  it('asks for an active subscription otherwise', () => {
    expect(planRestrictionMessage(paymentRequired('An active subscription is required'))).toContain('assinatura ativa');
  });
});
