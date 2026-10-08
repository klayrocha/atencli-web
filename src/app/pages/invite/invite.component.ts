import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { InvitationDetailsResponse, WizardService } from '../wizard-shared/wizard.service';

@Component({
  selector: 'app-invite', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './invite.component.html', styleUrl: './invite.component.scss'
})
export class InviteComponent implements OnInit, OnDestroy {
  invitation: InvitationDetailsResponse | null = null;
  loading = true;
  submitting = false;
  accepted = false;
  error = '';
  password = '';
  confirmation = '';
  private token = '';
  private version = 0;
  private subscription?: Subscription;
  readonly roles = { ADMIN: 'Administrador', MANAGER: 'Gerente', ATTENDANT: 'Atendente' };

  constructor(private route: ActivatedRoute, private api: WizardService) {}
  ngOnInit() {
    this.subscription = this.route.paramMap.subscribe(params => {
      this.token = params.get('token') ?? '';
      this.accepted = false; this.password = ''; this.confirmation = '';
      void this.load();
    });
  }
  ngOnDestroy() { this.version++; this.subscription?.unsubscribe(); this.password = ''; this.confirmation = ''; }
  get passwordValid() {
    return this.password.length >= 8 && this.password.length <= 72 &&
      /\p{Lu}/u.test(this.password) && /\p{Ll}/u.test(this.password) && /\p{Nd}/u.test(this.password) && !/\s/u.test(this.password);
  }
  get pending() { return this.invitation?.status === 'PENDING' && !this.accepted; }
  get statusMessage() {
    switch (this.invitation?.status) {
      case 'EXPIRED': return 'Este convite expirou. Peça ao administrador da clínica um novo convite.';
      case 'CANCELLED': return 'Este convite foi cancelado. Entre em contato com o administrador da clínica.';
      case 'ACCEPTED': return 'Este convite já foi aceito. Entre com sua conta para continuar.';
      default: return '';
    }
  }
  async load() {
    const version = ++this.version;
    this.loading = true; this.error = ''; this.invitation = null; this.submitting = false;
    if (!this.token) { this.error = 'Link de convite inválido.'; this.loading = false; return; }
    try {
      const details = await this.api.getInvitationDetails(this.token);
      if (version === this.version) this.invitation = details;
    } catch (error: unknown) {
      if (version === this.version) this.error = this.errorMessage(error);
    } finally { if (version === this.version) this.loading = false; }
  }
  async accept() {
    if (!this.pending || this.loading || this.submitting || this.invitation?.authProvider !== 'LOCAL') return;
    if (!this.passwordValid || this.password !== this.confirmation) {
      this.error = 'Confira os requisitos da senha e sua confirmação.'; return;
    }
    const version = this.version;
    this.submitting = true; this.error = '';
    try {
      await this.api.acceptLocalInvitation(this.token, this.password);
      if (version !== this.version) return;
      this.accepted = true; this.password = ''; this.confirmation = '';
    } catch (error: unknown) {
      if (version === this.version) this.error = this.errorMessage(error, true);
    } finally { if (version === this.version) this.submitting = false; }
  }
  acceptGoogle() {
    if (!this.pending || this.loading || this.submitting || this.invitation?.authProvider !== 'GOOGLE') return;
    this.submitting = true;
    this.api.startGoogleInvitation(this.token);
  }
  private errorMessage(error: unknown, accepting = false) {
    const status = (error as { status?: number })?.status;
    if (status === 404) return 'Convite não encontrado. Confira o link recebido por e-mail.';
    if (status === 410) return 'Este convite expirou. Solicite um novo convite à clínica.';
    if (status === 409) return 'Não foi possível aceitar este convite. A conta pode já estar cadastrada. Entre em contato com a clínica.';
    if (status === 400 || status === 422) return accepting
      ? 'Não foi possível confirmar. Confira a senha e atualize o convite para verificar se ele ainda está válido.'
      : 'Este convite não está disponível. Solicite um novo link à clínica.';
    return accepting ? 'Não foi possível confirmar o convite. Tente novamente.' : 'Não foi possível carregar o convite. Tente novamente.';
  }
}
