import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../auth/auth.service';
import { routes } from '../../app.routes';

describe('Password reset page', () => {
  let auth: jasmine.SpyObj<AuthService>;
  const page = (query: Record<string, string>, fragment: string | null = null) => {
    const component = new ResetPasswordComponent(
      { snapshot: { queryParamMap: convertToParamMap(query), fragment } } as unknown as ActivatedRoute, auth);
    component.ngOnInit();
    return component;
  };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['resetPassword']);
    auth.resetPassword.and.resolveTo();
    spyOn(history, 'replaceState');
  });

  it('is public, outside the authentication guards', () => {
    const route = routes.find(r => r.path === 'reset-password');
    expect(route?.canActivate).toBeUndefined();
    expect(route?.loadComponent).toBeDefined();
  });

  it('reads the token after "#", which the browser never sends to the server', async () => {
    const component = page({}, 'token=from-fragment');
    expect(history.replaceState).toHaveBeenCalled();
    component.password = component.confirmation = 'NovaSenha123';
    await component.submit();
    expect(auth.resetPassword).toHaveBeenCalledWith('from-fragment', 'NovaSenha123', 'NovaSenha123');
  });

  it('still accepts links in the old "?token=" format', async () => {
    const component = page({ token: 'one-time' });
    expect(history.replaceState).toHaveBeenCalled();
    component.password = component.confirmation = 'NovaSenha123';
    await component.submit();
    expect(auth.resetPassword).toHaveBeenCalledWith('one-time', 'NovaSenha123', 'NovaSenha123');
    expect(component.done).toBeTrue();
    expect(component.password).toBe('');
  });

  it('does not submit weak or mismatched passwords', async () => {
    const component = page({ token: 'one-time' });
    component.password = 'fraca'; component.confirmation = 'fraca';
    await component.submit();
    component.password = 'NovaSenha123'; component.confirmation = 'Outra123456';
    await component.submit();
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('explains expired or used links', async () => {
    auth.resetPassword.and.rejectWith({ status: 400, error: { message: 'This password reset link is invalid or has expired.' } });
    const component = page({ token: 'old' });
    component.password = component.confirmation = 'NovaSenha123';
    await component.submit();
    expect(component.error).toContain('expirou');
    expect(component.done).toBeFalse();
  });

  it('shows an error without a token', () => {
    expect(page({}).error).toContain('Link inválido');
  });
});
