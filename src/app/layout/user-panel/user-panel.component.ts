import { Component, computed, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../auth/auth.service';

type PanelView = 'profile' | 'change-password';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarModule],
  template: `
    <!-- Overlay -->
    <div class="panel-overlay" (click)="close.emit()"></div>

    <!-- Drawer -->
    <aside class="user-panel">

      <!-- Header -->
      <div class="panel-header">
        <span class="panel-title">{{ view() === 'profile' ? 'Minha conta' : 'Alterar senha' }}</span>
        <button class="panel-close" (click)="close.emit()">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- ══════ VIEW: PERFIL ══════ -->
      <div class="panel-body" *ngIf="view() === 'profile'">

        <div class="profile-avatar-section">
          <p-avatar
            [label]="initials()"
            shape="circle"
            size="xlarge"
            [style]="{'background-color':'#84cc16','color':'#fff','font-weight':'700','font-size':'1.5rem','width':'72px','height':'72px'}">
          </p-avatar>
          <div class="profile-info">
            <div class="profile-name">{{ fullName() }}</div>
            <div class="profile-email">{{ email() }}</div>
          </div>
        </div>

        <div class="panel-divider"></div>

        <!-- Conta Google: sem opção de alterar senha -->
        <div class="google-account-info" *ngIf="isGoogleUser()">
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.84-1.57 2.4v2h2.54c1.49-1.38 2.35-3.4 2.35-5.86 0-.57-.05-1.12-.09-1.54z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.54-2c-.72.48-1.63.76-2.76.76-2.12 0-3.92-1.43-4.56-3.36H1.8v2.07C3.12 15.1 5.88 17 8.98 17z"/>
            <path fill="#FBBC05" d="M4.42 10.46A5.1 5.1 0 0 1 4.17 9c0-.51.09-1 .25-1.46V5.47H1.8A8.98 8.98 0 0 0 .98 9c0 1.45.35 2.82.96 4.02z"/>
            <path fill="#EA4335" d="M8.98 3.58c1.19 0 2.26.41 3.1 1.21l2.33-2.33C12.95 1.19 11.13.4 8.98.4 5.88.4 3.12 2.3 1.8 5.03l2.62 2.07c.64-1.93 2.44-3.52 4.56-3.52z"/>
          </svg>
          <span>Conta gerenciada pelo Google. A senha é controlada pela sua conta Google.</span>
        </div>

        <div class="profile-actions" *ngIf="!isGoogleUser()">
          <button class="action-item" (click)="view.set('change-password')">
            <div class="action-icon">
              <i class="pi pi-lock"></i>
            </div>
            <div class="action-info">
              <span class="action-label">Alterar senha</span>
              <span class="action-sub">Atualize sua senha de acesso</span>
            </div>
            <i class="pi pi-chevron-right action-chevron"></i>
          </button>
        </div>

      </div>

      <!-- ══════ VIEW: ALTERAR SENHA ══════ -->
      <div class="panel-body" *ngIf="view() === 'change-password'">

        <button class="back-btn" (click)="goBack()">
          <i class="pi pi-arrow-left"></i> Voltar
        </button>

        <!-- Alerta de erro -->
        <div class="alert alert-error" *ngIf="errorMsg()">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errorMsg() }}</span>
        </div>

        <!-- Alerta de sucesso -->
        <div class="alert alert-success" *ngIf="successMsg()">
          <i class="pi pi-check-circle"></i>
          <span>{{ successMsg() }}</span>
        </div>

        <form class="pw-form" (ngSubmit)="onSubmit()" #pwForm="ngForm" *ngIf="!successMsg()">

          <!-- Senha atual -->
          <div class="field">
            <label>Senha atual</label>
            <div class="input-wrapper">
              <i class="pi pi-lock input-icon"></i>
              <input
                [type]="showCurrent ? 'text' : 'password'"
                [(ngModel)]="form.currentPassword"
                name="currentPassword"
                placeholder="••••••••"
                class="pw-input" />
              <button type="button" class="toggle-pw" (click)="showCurrent = !showCurrent">
                <i class="pi" [class.pi-eye]="!showCurrent" [class.pi-eye-slash]="showCurrent"></i>
              </button>
            </div>
          </div>

          <!-- Nova senha -->
          <div class="field">
            <label>Nova senha</label>
            <div class="input-wrapper">
              <i class="pi pi-lock-open input-icon"></i>
              <input
                [type]="showNew ? 'text' : 'password'"
                [(ngModel)]="form.newPassword"
                name="newPassword"
                placeholder="••••••••"
                class="pw-input"
                (input)="validatePassword()" />
              <button type="button" class="toggle-pw" (click)="showNew = !showNew">
                <i class="pi" [class.pi-eye]="!showNew" [class.pi-eye-slash]="showNew"></i>
              </button>
            </div>
            <!-- Indicador de força -->
            <div class="pw-rules" *ngIf="form.newPassword">
              <div class="rule" [class.ok]="rules.length">
                <i class="pi" [class.pi-check]="rules.length" [class.pi-times]="!rules.length"></i>
                Mínimo 8 caracteres
              </div>
              <div class="rule" [class.ok]="rules.upper">
                <i class="pi" [class.pi-check]="rules.upper" [class.pi-times]="!rules.upper"></i>
                Letra maiúscula
              </div>
              <div class="rule" [class.ok]="rules.lower">
                <i class="pi" [class.pi-check]="rules.lower" [class.pi-times]="!rules.lower"></i>
                Letra minúscula
              </div>
              <div class="rule" [class.ok]="rules.number">
                <i class="pi" [class.pi-check]="rules.number" [class.pi-times]="!rules.number"></i>
                Número
              </div>
              <div class="rule" [class.ok]="rules.special">
                <i class="pi" [class.pi-check]="rules.special" [class.pi-times]="!rules.special"></i>
                Caractere especial (!&#64;#$%...)
              </div>
            </div>
          </div>

          <!-- Confirmar nova senha -->
          <div class="field">
            <label>Confirmar nova senha</label>
            <div class="input-wrapper">
              <i class="pi pi-lock-open input-icon"></i>
              <input
                [type]="showConfirm ? 'text' : 'password'"
                [(ngModel)]="form.confirmNewPassword"
                name="confirmNewPassword"
                placeholder="••••••••"
                class="pw-input"
                [class.input-error]="form.confirmNewPassword && form.newPassword !== form.confirmNewPassword" />
              <button type="button" class="toggle-pw" (click)="showConfirm = !showConfirm">
                <i class="pi" [class.pi-eye]="!showConfirm" [class.pi-eye-slash]="showConfirm"></i>
              </button>
            </div>
            <span class="field-error" *ngIf="form.confirmNewPassword && form.newPassword !== form.confirmNewPassword">
              As senhas não coincidem.
            </span>
          </div>

          <button type="submit" class="submit-btn" [disabled]="submitting() || !canSubmit()">
            <i class="pi pi-spin pi-spinner" *ngIf="submitting()"></i>
            <span>{{ submitting() ? 'Salvando...' : 'Salvar nova senha' }}</span>
          </button>

        </form>

      </div>

    </aside>
  `,
  styleUrls: ['./user-panel.component.scss'],
})
export class UserPanelComponent {

  @Output() close = new EventEmitter<void>();

  private auth = inject(AuthService);

  view     = signal<PanelView>('profile');
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  submitting = signal(false);

  showCurrent = false;
  showNew     = false;
  showConfirm = false;

  form: PasswordForm = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

  rules = { length: false, upper: false, lower: false, number: false, special: false };

  readonly isGoogleUser = computed(() => this.auth.currentUser()?.provider === 'google');
  readonly fullName     = computed(() => this.auth.currentProfile()?.fullName ?? this.auth.currentUser()?.name ?? 'Usuário');
  readonly email        = computed(() => this.auth.currentProfile()?.email    ?? this.auth.currentUser()?.email ?? '');
  readonly initials     = computed(() => {
    const n = this.fullName();
    return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  });

  goBack(): void {
    this.view.set('profile');
    this.errorMsg.set(null);
    this.successMsg.set(null);
    this.form = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
    this.rules = { length: false, upper: false, lower: false, number: false, special: false };
  }

  validatePassword(): void {
    const p = this.form.newPassword;
    this.rules = {
      length:  p.length >= 8,
      upper:   /[A-Z]/.test(p),
      lower:   /[a-z]/.test(p),
      number:  /[0-9]/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  }

  canSubmit(): boolean {
    return (
      !!this.form.currentPassword &&
      Object.values(this.rules).every(Boolean) &&
      this.form.newPassword === this.form.confirmNewPassword
    );
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.errorMsg.set(null);
    try {
      await this.auth.changePassword(this.form.currentPassword, this.form.newPassword, this.form.confirmNewPassword);
      this.successMsg.set('Senha alterada com sucesso!');
    } catch (err: any) {
      let message = 'Erro ao alterar senha. Tente novamente.';
      let backendMsg = '';

      if (err?.error) {
        if (typeof err.error === 'string') {
          try {
            const parsed = JSON.parse(err.error);
            backendMsg = parsed?.message || '';
          } catch {
            backendMsg = err.error;
          }
        } else if (err.error?.message) {
          backendMsg = err.error.message;
        }
      }

      if (backendMsg.toLowerCase().includes('current password is invalid') || backendMsg.toLowerCase().includes('senha atual')) {
        message = 'Senha atual incorreta. Digite sua senha atual para continuar.';
      } else if (backendMsg.toLowerCase().includes('invalid') || err?.status === 400) {
        message = 'Cadastre uma senha válida.';
      } else if (backendMsg) {
        message = backendMsg;
      }

      this.errorMsg.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
