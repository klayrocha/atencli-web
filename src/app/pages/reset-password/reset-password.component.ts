import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/** Página aberta pelo link de "Esqueci a senha": define a nova senha com o token de uso único. */
@Component({
  selector: 'app-reset-password', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html', styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmation = '';
  submitting = false;
  done = false;
  error = '';
  token = '';

  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  ngOnInit() {
    // O link usa "#token=..." para o token não chegar ao servidor (nem aos logs do nginx).
    // "?token=" é o formato antigo, aceito enquanto houver links enviados antes da mudança.
    const fragment = new URLSearchParams(this.route.snapshot.fragment ?? '');
    this.token = fragment.get('token') ?? this.route.snapshot.queryParamMap.get('token') ?? '';
    if (this.token) {
      // O token não fica na barra de endereço nem no histórico.
      history.replaceState(null, '', location.pathname);
    } else {
      this.error = 'Link inválido. Peça um novo link em "Esqueci a senha".';
    }
  }

  get passwordValid() {
    return this.password.length >= 8 && this.password.length <= 72 &&
      /\p{Lu}/u.test(this.password) && /\p{Ll}/u.test(this.password) && /\p{Nd}/u.test(this.password) && !/\s/u.test(this.password);
  }

  async submit() {
    if (!this.token || this.submitting || this.done) return;
    if (!this.passwordValid || this.password !== this.confirmation) {
      this.error = 'Confira os requisitos da senha e sua confirmação.'; return;
    }
    this.submitting = true; this.error = '';
    try {
      await this.auth.resetPassword(this.token, this.password, this.confirmation);
      this.done = true; this.password = ''; this.confirmation = '';
    } catch (error: unknown) {
      this.error = this.errorMessage(error);
    } finally {
      this.submitting = false;
    }
  }

  private errorMessage(error: unknown) {
    const status = (error as { status?: number })?.status;
    const message = (error as { error?: { message?: string } })?.error?.message ?? '';
    if (status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    if (status === 400 && /invalid or has expired/i.test(message)) {
      return 'Este link é inválido, já foi usado ou expirou. Peça um novo link em "Esqueci a senha".';
    }
    if (status === 400) return 'A senha não atende aos requisitos. Confira e tente novamente.';
    return 'Não foi possível redefinir a senha. Tente novamente.';
  }
}
