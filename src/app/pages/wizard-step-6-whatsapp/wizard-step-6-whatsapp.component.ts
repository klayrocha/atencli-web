import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

type ConnectionStatus = 'NOT_CONFIGURED' | 'CONNECTED' | 'PAUSED' | 'DISCONNECTED' | 'ERROR';

@Component({
  selector: 'app-wizard-step-6-whatsapp',
  standalone: true,
  imports: [CommonModule, WizardSummaryComponent],
  templateUrl: './wizard-step-6-whatsapp.component.html',
  styleUrls: ['./wizard-step-6-whatsapp.component.scss'],
})
export class WizardStep6WhatsappComponent {
  connectionStatus: ConnectionStatus = 'NOT_CONFIGURED';
  connectionNotice = signal(false);
  connecting = signal(false);
  verifiedName: string | null = null;
  displayPhoneNumber: string | null = null;
  connectionMode: 'CLOUD_API' | 'COEXISTENCE' | null = null;
  contactsSynchronized = false;

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(step => ({
    ...step,
    current: step.id === 6,
    completed: step.id < 6,
  }));

  constructor(
    private router: Router,
    private authService: AuthService,
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

  beginConnection(): void {
    if (!this.canManageIntegration || this.connecting()) return;

    this.connecting.set(true);
    this.connectionNotice.set(false);
    window.setTimeout(() => {
      this.connectionStatus = 'CONNECTED';
      this.verifiedName = 'Clínica Harmonia';
      this.displayPhoneNumber = '+55 (11) 99876-5432';
      this.connectionMode = 'COEXISTENCE';
      this.contactsSynchronized = true;
      this.connecting.set(false);
      this.connectionNotice.set(true);
    }, 900);
  }

  dismissNotice(): void {
    this.connectionNotice.set(false);
  }

  toggleIntegration(): void {
    if (!this.canManageIntegration) return;
    this.connectionStatus = this.connectionStatus === 'PAUSED' ? 'CONNECTED' : 'PAUSED';
  }

  disconnect(): void {
    if (!this.canManageIntegration) return;
    this.connectionStatus = 'NOT_CONFIGURED';
    this.verifiedName = null;
    this.displayPhoneNumber = null;
    this.connectionMode = null;
    this.contactsSynchronized = false;
    this.connectionNotice.set(false);
  }

  goBack(): void {
    this.router.navigate(['/wizard-step-5-team']);
  }

  goNext(): void {
    this.router.navigate(['/ia']);
  }

  activateService(): void {}
}
