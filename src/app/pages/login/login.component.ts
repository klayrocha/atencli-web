import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { AuthService } from '../../auth/auth.service';

const REMEMBERED_EMAIL_KEY = 'atenclin:login:remembered-email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    ProgressSpinnerModule,
    MessageModule,
    DividerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

  // ── Login
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;

  // ── Forgot password
  view = signal<'login' | 'forgot'>('login');
  forgotEmail = '';
  forgotLoading = signal(false);
  forgotSent = signal(false);

  get loading() { return this.auth.loading; }
  get error()   { return this.auth.error;   }

  constructor(public auth: AuthService) {
    try {
      const email = localStorage.getItem(REMEMBERED_EMAIL_KEY)?.trim();
      if (email) {
        this.email = email;
        this.rememberMe = true;
      }
    } catch { /* O login continua disponível quando o armazenamento está bloqueado. */ }
  }

  onRememberMeChange(remember: boolean): void {
    this.rememberMe = remember;
    this.storeRememberedEmail();
  }

  onEmailChange(email: string): void {
    this.email = email;
    this.storeRememberedEmail();
    this.clearError();
  }

  private storeRememberedEmail(): void {
    try {
      if (this.rememberMe && this.email.trim()) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, this.email.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch { /* Não bloqueia a autenticação se o navegador impedir a persistência. */ }
  }

  // ── Login
  async onEmailLogin(): Promise<void> {
    this.storeRememberedEmail();
    if (!this.email || !this.password) {
      this.auth.error.set('Preencha e-mail e senha.');
      return;
    }
    await this.auth.loginWithEmail(this.email, this.password);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  clearError(): void {
    this.auth.error.set(null);
  }

  // ── Forgot password
  showForgot(): void {
    this.forgotEmail = '';
    this.forgotSent.set(false);
    this.auth.error.set(null);
    this.view.set('forgot');
  }

  backToLogin(): void {
    this.forgotSent.set(false);
    this.auth.error.set(null);
    this.view.set('login');
  }

  async onForgotSubmit(): Promise<void> {
    if (!this.forgotEmail) {
      this.auth.error.set('Informe seu e-mail de cadastro.');
      return;
    }
    this.forgotLoading.set(true);
    this.auth.error.set(null);
    try {
      await this.auth.forgotPassword(this.forgotEmail);
    } finally {
      this.forgotLoading.set(false);
      this.forgotSent.set(true);
    }
  }
}
