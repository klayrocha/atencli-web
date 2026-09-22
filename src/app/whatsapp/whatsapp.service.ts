import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment.development';

export interface WhatsAppIntegration {
  id: number | null;
  configured: boolean;
  enabled: boolean;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | null;
  onboardingMode: 'CLOUD_API' | 'COEXISTENCE' | null;
  metaBusinessId: string | null;
  wabaId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  webhookSubscribed: boolean;
  phoneRegistered: boolean;
  contactsSyncRequestId: string | null;
  historySyncRequestId: string | null;
  tokenExpiresAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  updatedAt: string | null;
}

export interface SignupConfig {
  appId: string;
  configurationId: string;
  graphApiVersion: string;
  sessionInfoEventType: string;
  coexistenceFinishEvent: string;
}

export interface CompleteSignup {
  code: string;
  wabaId: string;
  phoneNumberId: string;
  businessId: string | null;
  event: string;
  pin: string | null;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/whatsapp`;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private get options() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }
  getIntegration() {
    return firstValueFrom(this.http.get<WhatsAppIntegration>(`${this.url}/integration`, this.options));
  }
  getSignupConfig() {
    return firstValueFrom(this.http.get<SignupConfig>(`${this.url}/embedded-signup/config`, this.options));
  }
  complete(payload: CompleteSignup) {
    return firstValueFrom(this.http.post<WhatsAppIntegration>(`${this.url}/embedded-signup/complete`, payload, this.options));
  }
  setEnabled(enabled: boolean) {
    return firstValueFrom(this.http.patch<WhatsAppIntegration>(`${this.url}/integration/status`, { enabled }, this.options));
  }
}
