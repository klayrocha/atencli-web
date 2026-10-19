import { ConfigurationChanges } from '../wizard-shared/configuration-changes';
import { WizardStepperComponent } from '../wizard-shared/wizard-stepper.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { InstagramAccount, InstagramIntegration, InstagramOAuthAccountsResponse, InstagramService } from '../../instagram/instagram.service';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

type ConnectionStatus = 'NOT_CONFIGURED' | 'CONNECTED' | 'PAUSED' | 'DISCONNECTED' | 'ERROR';

@Component({
  selector: 'app-wizard-step-7-instagram',
  standalone: true,
  imports: [WizardStepperComponent, CommonModule, FormsModule, WizardSummaryComponent],
  templateUrl: './wizard-step-7-instagram.component.html',
  styleUrls: ['./wizard-step-7-instagram.component.scss'],
})
export class WizardStep7InstagramComponent implements OnInit {
  readonly configurationChanges: ConfigurationChanges = new ConfigurationChanges(
    () => this.accountsResponse ? this.selectedInstagramUserId : '',
    async () => { await this.connectSelectedAccount(); return !this.error() && !this.configurationChanges.hasChanges(); },
  );

  integration: InstagramIntegration | null = null;
  accountsResponse: InstagramOAuthAccountsResponse | null = null;
  selectedInstagramUserId = '';
  loading = signal(true);
  starting = signal(false);
  exchanging = signal(false);
  connecting = signal(false);
  updating = signal(false);
  success = signal('');
  error = signal('');

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(step => ({
    ...step,
    current: step.id === 8,
    completed: step.id < 8,
  }));

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private api: InstagramService,
  ) {}

  get canManageIntegration(): boolean {
    const roles = this.authService.currentProfile()?.roles ?? [];
    return roles.some(role => role === 'ADMIN' || role === 'MANAGER');
  }

  get connectionStatus(): ConnectionStatus {
    if (!this.integration?.id) return 'NOT_CONFIGURED';
    if (this.integration.connectionStatus === 'CONNECTED' && !this.integration.enabled) return 'PAUSED';
    return this.integration.connectionStatus ?? 'ERROR';
  }

  get busy() { return this.loading() || this.starting() || this.exchanging() || this.connecting() || this.updating(); }
  get username() { return this.integration?.username ? `@${this.integration.username}` : null; }
  get selectedAccount(): InstagramAccount | null {
    return this.accountsResponse?.accounts.find(account => account.instagramUserId === this.selectedInstagramUserId) ?? null;
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

  async ngOnInit(): Promise<void> {
    this.configurationChanges.markSaved();
    await this.load();
    const params = this.route.snapshot.queryParamMap;
    const error = params.get('error') || params.get('error_message');
    if (error) {
      this.error.set('A autorização do Instagram foi cancelada ou recusada. Tente conectar novamente.');
      await this.clearCallbackUrl();
      return;
    }
    const code = params.get('code');
    if (code && this.canManageIntegration) await this.exchangeCode(code);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try { this.integration = await this.api.getIntegration(); }
    catch (error) { this.error.set(this.errorMessage(error)); }
    finally { this.loading.set(false); }
  }

  async beginConnection(): Promise<void> {
    if (!this.canManageIntegration || this.busy) return;
    this.starting.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const config = await this.api.getOAuthConfig();
      const state = this.generateState();
      sessionStorage.setItem('atenclin:instagram-oauth-state', state);
      const params = new URLSearchParams({
        client_id: config.appId,
        redirect_uri: this.redirectUri(),
        response_type: 'code',
        scope: config.scopes.join(','),
        state,
      });
      window.location.href = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
    } catch (error) {
      this.error.set(this.errorMessage(error));
      this.starting.set(false);
    }
  }

  async exchangeCode(code: string): Promise<void> {
    const state = this.route.snapshot.queryParamMap.get('state');
    const expectedState = sessionStorage.getItem('atenclin:instagram-oauth-state');
    sessionStorage.removeItem('atenclin:instagram-oauth-state');
    if (expectedState && state !== expectedState) {
      this.error.set('Não foi possível validar o retorno da Meta. Inicie a conexão novamente.');
      await this.clearCallbackUrl();
      return;
    }
    this.exchanging.set(true);
    this.error.set('');
    try {
      this.accountsResponse = await this.api.getOAuthAccounts(code, this.redirectUri());
      this.selectedInstagramUserId = this.accountsResponse.accounts[0]?.instagramUserId ?? '';
      this.configurationChanges.markSaved();
      if (!this.selectedInstagramUserId) {
        this.error.set('Nenhuma conta profissional do Instagram foi autorizada neste login.');
      } else if (this.accountsResponse.accounts.length === 1) {
        await this.connectSelectedAccount();
      }
    } catch (error) { this.error.set(this.errorMessage(error)); }
    finally {
      this.exchanging.set(false);
      await this.clearCallbackUrl();
    }
  }

  async connectSelectedAccount(): Promise<void> {
    if (!this.accountsResponse?.connectionToken || !this.selectedInstagramUserId || this.connecting() || this.updating() || !this.canManageIntegration) return;
    this.connecting.set(true);
    this.error.set('');
    this.success.set('');
    try {
      this.integration = await this.api.connect(this.accountsResponse.connectionToken, this.selectedInstagramUserId);
      this.accountsResponse = null;
      this.selectedInstagramUserId = '';
      this.configurationChanges.markSaved();
      this.success.set('Instagram conectado com sucesso.');
    } catch (error) { this.error.set(this.errorMessage(error)); }
    finally { this.connecting.set(false); }
  }

  async toggleIntegration(): Promise<void> {
    if (!this.canManageIntegration || this.busy || !this.integration?.id) return;
    this.updating.set(true);
    this.error.set('');
    this.success.set('');
    try { this.integration = await this.api.setEnabled(!this.integration.enabled); }
    catch (error) { this.error.set(this.errorMessage(error)); }
    finally { this.updating.set(false); }
  }

  private redirectUri(): string {
    const base = window.location.origin;
    return `${base}${base.includes('localhost') ? '' : '/web'}/integracoes/instagram/callback`;
  }

  private generateState(): string {
    const data = new Uint8Array(16);
    window.crypto.getRandomValues(data);
    return Array.from(data, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async clearCallbackUrl(): Promise<void> {
    await this.router.navigate(['/wizard-step-7-instagram'], { replaceUrl: true });
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return error instanceof Error ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
    const messages: Record<number, string> = {
      0: 'Não foi possível acessar o servidor. Verifique sua conexão e tente novamente.',
      400: 'Não foi possível concluir a configuração. Confirme as permissões concedidas na Meta e tente novamente.',
      401: 'Sua sessão expirou. Entre novamente.',
      403: 'Somente administradores e gestores podem alterar esta conexão.',
      404: 'Integração não encontrada. Atualize o status e tente novamente.',
      409: 'Esta conta do Instagram já está vinculada a outra clínica.',
    };
    return messages[error.status] ?? 'Não foi possível concluir a operação com o Instagram. Tente novamente mais tarde.';
  }

  goBack(): void { this.router.navigate(['/wizard-step-6-whatsapp']); }
  goNext(): void { this.router.navigate(['/ia']); }
  activateService(): void {}
}
