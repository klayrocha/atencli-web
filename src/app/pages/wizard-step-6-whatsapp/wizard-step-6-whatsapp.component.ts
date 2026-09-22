import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { WhatsAppService, WhatsAppIntegration, SignupConfig } from '../../whatsapp/whatsapp.service';
import { MetaEmbeddedSignupService } from '../../whatsapp/meta-embedded-signup.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

type ConnectionStatus = 'NOT_CONFIGURED' | 'CONNECTED' | 'PAUSED' | 'DISCONNECTED' | 'ERROR';

@Component({
  selector: 'app-wizard-step-6-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule, WizardSummaryComponent],
  templateUrl: './wizard-step-6-whatsapp.component.html',
  styleUrls: ['./wizard-step-6-whatsapp.component.scss'],
})
export class WizardStep6WhatsappComponent implements OnInit, OnDestroy {
  integration: WhatsAppIntegration | null = null;
  configuration: SignupConfig | null = null;
  connectionNotice = signal(false);
  connecting = signal(false);
  loading = signal(true);
  preparing = signal(false);
  updating = signal(false);
  error = signal('');
  pin = '';
  pinRequired = signal(false);
  private destroyed = false;

  get connectionStatus(): ConnectionStatus {
    if (!this.integration?.configured) return 'NOT_CONFIGURED';
    if (this.integration.connectionStatus === 'CONNECTED' && !this.integration.enabled) return 'PAUSED';
    return this.integration.connectionStatus ?? 'ERROR';
  }
  get verifiedName() { return this.integration?.verifiedName; }
  get displayPhoneNumber() { return this.integration?.displayPhoneNumber; }
  get connectionMode() { return this.integration?.onboardingMode; }
  get busy() { return this.loading() || this.preparing() || this.connecting() || this.updating(); }
  get synchronizationLabel() {
    if (this.connectionMode !== 'COEXISTENCE') return 'Não se aplica';
    const contacts = this.integration?.contactsSyncRequestId ? 'Contatos: solicitada' : 'Contatos: não solicitada';
    const history = this.integration?.historySyncRequestId ? 'Histórico: solicitada' : 'Histórico: não solicitada';
    return `${contacts} · ${history}`;
  }

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(step => ({
    ...step,
    current: step.id === 6,
    completed: step.id < 6,
  }));

  constructor(
    private router: Router,
    private authService: AuthService,
    private api: WhatsAppService,
    private meta: MetaEmbeddedSignupService,
  ) {}

  get canManageIntegration(): boolean {
    const roles = this.authService.currentProfile()?.roles ?? [];
    return roles.some(role => role === 'ADMIN' || role === 'MANAGER');
  }

  get statusLabel(): string {
    const labels: Record<ConnectionStatus, string> = {
      NOT_CONFIGURED: 'Não configurada',
      CONNECTED: 'Conectada',
      PAUSED: 'Pausada',
      DISCONNECTED: 'Desconectada',
      ERROR: 'Com erro',
    };
    return labels[this.connectionStatus];
  }

  ngOnInit(): void { void this.load(); }
  ngOnDestroy(): void { this.destroyed = true; this.meta.cancel(); this.pin = ''; }

  async load(): Promise<void> {
    if (this.connecting() || this.updating() || this.preparing()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      this.integration = await this.api.getIntegration();
    } catch (error) {
      this.error.set(this.errorMessage(error));
      return;
    } finally { this.loading.set(false); }
    if (!this.destroyed && this.canManageIntegration) await this.prepare();
  }

  async prepare(): Promise<void> {
    this.preparing.set(true);
    this.configuration = null;
    try {
      const config = await this.api.getSignupConfig();
      if (this.destroyed) return;
      await this.meta.prepare(config);
      if (!this.destroyed) this.configuration = config;
    } catch (error) { this.error.set(this.errorMessage(error)); }
    finally { this.preparing.set(false); }
  }

  async beginConnection(): Promise<void> {
    if (!this.canManageIntegration || this.busy || !this.configuration || !this.integration) return;
    this.error.set('');
    if (this.pinRequired() && !/^\d{6}$/.test(this.pin)) {
      this.error.set('O PIN deve conter exatamente seis dígitos.');
      return;
    }
    this.connecting.set(true);
    this.connectionNotice.set(false);
    try {
      const payload = await this.meta.start(this.configuration, this.pinRequired() ? this.pin : this.generatePin());
      this.pin = '';
      if (this.destroyed) return;
      try {
        this.integration = await this.api.complete(payload);
        this.pinRequired.set(false);
        this.connectionNotice.set(true);
      } finally { payload.code = ''; payload.pin = null; }
    } catch (error) {
      if (!this.destroyed) {
        if (this.requiresPin(error)) {
          this.pinRequired.set(true);
          this.error.set('Não foi possível validar o PIN do número. Informe o PIN de seis dígitos do WhatsApp e conecte novamente.');
        } else {
          this.error.set(this.errorMessage(error));
        }
      }
    }
    finally { this.pin = ''; this.connecting.set(false); }
  }

  private generatePin(): string {
    // Rejection sampling avoids modulo bias; the PIN is never persisted.
    const value = new Uint32Array(1);
    do { window.crypto.getRandomValues(value); } while (value[0] >= 4294000000);
    return (value[0] % 1000000).toString().padStart(6, '0');
  }

  private requiresPin(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) return false;
    const message: unknown = error.error?.message;
    // Only a specific PIN validation error reveals the input, never a generic 400/500.
    return typeof message === 'string'
      && /\bpin\b/i.test(message)
      && /required|invalid|incorrect|mismatch|missing|obrigat[oó]rio|necess[aá]rio|inv[aá]lid[oa]|incorret[oa]/i.test(message);
  }

  dismissNotice(): void { this.connectionNotice.set(false); }

  async toggleIntegration(): Promise<void> {
    if (!this.canManageIntegration || this.busy || !this.integration?.configured) return;
    this.updating.set(true);
    this.error.set('');
    this.connectionNotice.set(false);
    try { this.integration = await this.api.setEnabled(!this.integration.enabled); }
    catch (error) { this.error.set(this.errorMessage(error)); }
    finally { this.updating.set(false); }
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return error instanceof Error ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
    }
    // Do not expose upstream Meta exceptions, credentials or internal diagnostics.
    const messages: Record<number, string> = {
      0: 'Não foi possível acessar o servidor. Verifique sua conexão e tente novamente.',
      400: 'Não foi possível concluir a configuração. Tente conectar novamente. Se o erro persistir, contate o administrador.',
      401: 'Sua sessão expirou. Entre novamente.',
      403: 'Somente administradores e gestores podem alterar esta conexão.',
      404: 'Integração não encontrada. Atualize o status e tente novamente.',
      409: 'Este número já está vinculado a uma clínica ou existe outro número conectado. Não é possível trocar o número por aqui.',
    };
    return messages[error.status] ?? 'Não foi possível concluir a operação com o WhatsApp. Tente novamente mais tarde.';
  }

  goBack(): void {
    this.router.navigate(['/wizard-step-5-team']);
  }

  goNext(): void {
    this.router.navigate(['/ia']);
  }

  activateService(): void {}
}
