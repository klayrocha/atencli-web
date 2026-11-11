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

  constructor(public auth: AuthService) {}

  // ── Login
  async onEmailLogin(): Promise<void> {
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
