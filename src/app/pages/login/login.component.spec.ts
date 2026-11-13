import { signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { LoginComponent } from './login.component';

describe('Login remembered email', () => {
  const key = 'atenclin:login:remembered-email';
  let auth: jasmine.SpyObj<AuthService>;
  beforeEach(() => {
    localStorage.removeItem(key);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['loginWithEmail'], { error: signal<string | null>(null) });
    auth.loginWithEmail.and.resolveTo();
  });
  afterEach(() => localStorage.removeItem(key));

  it('starts blank and unchecked without a saved email', () => {
    const page = new LoginComponent(auth);
    expect(page.email).toBe('');
    expect(page.rememberMe).toBeFalse();
  });

  it('remembers the email and restores the checked option when returning', () => {
    const page = new LoginComponent(auth);
    page.onEmailChange('ana@clinica.com');
    page.onRememberMeChange(true);
    const returning = new LoginComponent(auth);
    expect(returning.email).toBe('ana@clinica.com');
    expect(returning.rememberMe).toBeTrue();
  });

  it('updates the remembered email only while the option is checked', () => {
    const page = new LoginComponent(auth);
    page.onRememberMeChange(true);
    page.onEmailChange('novo@clinica.com');
    expect(localStorage.getItem(key)).toBe('novo@clinica.com');
    page.onEmailChange('');
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('removes the saved email immediately when unchecked and keeps the current form usable', () => {
    localStorage.setItem(key, 'ana@clinica.com');
    const page = new LoginComponent(auth);
    page.onRememberMeChange(false);
    expect(localStorage.getItem(key)).toBeNull();
    expect(page.email).toBe('ana@clinica.com');
    page.onEmailChange('outro@clinica.com');
    const returning = new LoginComponent(auth);
    expect(returning.email).toBe('');
    expect(returning.rememberMe).toBeFalse();
  });

  it('persists the final email on submit without storing the password', async () => {
    const page = new LoginComponent(auth);
    page.rememberMe = true;
    page.email = 'ana@clinica.com';
    page.password = 'test-only-password';
    await page.onEmailLogin();
    expect(localStorage.getItem(key)).toBe('ana@clinica.com');
    expect(auth.loginWithEmail).toHaveBeenCalledWith(page.email, page.password);
    expect(localStorage.getItem(key)).not.toContain(page.password);
  });

  it('allows login even when localStorage is unavailable', async () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('blocked');
    spyOn(Storage.prototype, 'setItem').and.throwError('blocked');
    const page = new LoginComponent(auth);
    page.onEmailChange('ana@clinica.com');
    page.onRememberMeChange(true);
    page.password = 'test-only-password';
    await page.onEmailLogin();
    expect(auth.loginWithEmail).toHaveBeenCalled();
  });
});
