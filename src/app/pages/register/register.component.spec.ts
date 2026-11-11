import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { RegisterComponent } from './register.component';

describe('Registration options', () => {
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['loginWithGoogle', 'registerUser']);
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
  });



  it('offers Google before the conventional form and uses the existing OAuth flow', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const button = root.querySelector<HTMLButtonElement>('.google-register-btn')!;
    const form = root.querySelector('form')!;
    expect(button.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(root.querySelectorAll('form input').length).toBe(5);
    button.click();
    expect(auth.loginWithGoogle).toHaveBeenCalledTimes(1);
    expect(auth.registerUser).not.toHaveBeenCalled();
  });

  it('does not start Google authentication while saving a conventional registration', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.google-register-btn');
    expect(button.disabled).toBeTrue();
    fixture.componentInstance.onGoogleRegister();
    expect(auth.loginWithGoogle).not.toHaveBeenCalled();
  });

  it('hides registration choices after a successful conventional registration', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.registered.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.google-register-btn')).toBeNull();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('.success-screen')).not.toBeNull();
  });
});
