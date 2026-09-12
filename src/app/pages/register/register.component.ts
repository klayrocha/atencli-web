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

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');

    // Se o usuário colou com 55 no início e tem 12 ou 13 dígitos
    if (digits.startsWith('55') && digits.length > 11) {
      digits = digits.substring(2);
    }

    // Limita a 11 dígitos (DDD + 9 dígitos)
    digits = digits.substring(0, 11);

    let formatted = '';
    if (digits.length === 0) {
      formatted = '';
    } else if (digits.length <= 2) {
      formatted = `(${digits}`;
    } else if (digits.length <= 6) {
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    } else if (digits.length <= 10) {
      // Formato fixo: (XX) XXXX-XXXX
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    } else {
      // Formato celular: (XX) XXXXX-XXXX
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
    }

    this.phoneNumber = formatted;
    input.value = formatted;
  }

  async onSubmit(): Promise<void> {
    const rawPhoneDigits = this.phoneNumber.replace(/\D/g, '');

    if (!this.fullName.trim() || !this.email.trim() || !this.password || !this.confirmPassword || !this.phoneNumber.trim()) {
      this.error.set('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (rawPhoneDigits.length < 10 || rawPhoneDigits.length > 11) {
      this.error.set('Por favor, informe um número de telefone válido com DDD (ex: (11) 99999-9999).');
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
      phoneNumber: `+55${rawPhoneDigits}`,
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
