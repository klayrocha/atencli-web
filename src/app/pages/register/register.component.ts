import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { AuthService, RegisterRequest } from '../../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    ProgressSpinnerModule,
    MessageModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  phoneNumber = '';
  showPassword = false;
  showConfirmPassword = false;

  loading = signal(false);
  error = signal<string | null>(null);
  registered = signal(false);

  constructor(private auth: AuthService) {}

  // Regras de validação de senha
  get hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.password);
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasNumber;
  }

  get passwordsMatch(): boolean {
    return !this.confirmPassword || this.password === this.confirmPassword;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  clearError(): void {
    this.error.set(null);
  }

  async onSubmit(): Promise<void> {
    if (!this.fullName.trim() || !this.email.trim() || !this.password || !this.confirmPassword || !this.phoneNumber.trim()) {
      this.error.set('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!this.isPasswordValid) {
      this.error.set('A senha deve ter no mínimo 8 caracteres, pelo menos uma letra maiúscula e pelo menos um número.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('As senhas não coincidem.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload: RegisterRequest = {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password,
      phoneNumber: this.phoneNumber.trim(),
    };

    try {
      await this.auth.registerUser(payload);
      this.registered.set(true);
    } catch (err: any) {
      if (err?.error?.message) {
        this.error.set(err.error.message);
      } else if (err?.status === 400) {
        this.error.set('Dados inválidos. Verifique as informações preenchidas.');
      } else if (err?.status === 409) {
        this.error.set('Este e-mail já está cadastrado.');
      } else {
        this.error.set('Ocorreu um erro ao processar o cadastro. Tente novamente mais tarde.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
