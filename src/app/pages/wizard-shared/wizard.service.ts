import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../auth/auth.service';

// ─── Modelos de lista ─────────────────────────────────────────────────────────

export interface StateOption {
  id: string;
  name: string;
}

export interface ClientTypeOption {
  id: string;
  name: string;
}

// ─── Modelo do formulário Passo 1 ─────────────────────────────────────────────

export interface AboutPayload {
  clientUuid: string;
  name: string;
  clientType: string;
  description: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  acceptsHealthPlan: boolean;
}

@Injectable({ providedIn: 'root' })
export class WizardService {

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  private get headers() {
    const token = this.auth.getToken();
    return { Authorization: `Bearer ${token}` };
  }

  private get clientUuid(): string {
    return this.auth.currentProfile()?.clientUuid ?? '';
  }

  // ─── Listas ───────────────────────────────────────────────────────────────

  async getStates(): Promise<StateOption[]> {
    return firstValueFrom(
      this.http.get<StateOption[]>(
        `${environment.apiBaseUrl}/api/v1/lists/all-states`,
        { headers: this.headers }
      )
    );
  }

  async getClientTypes(): Promise<ClientTypeOption[]> {
    return firstValueFrom(
      this.http.get<ClientTypeOption[]>(
        `${environment.apiBaseUrl}/api/v1/lists/all-type-clients`,
        { headers: this.headers }
      )
    );
  }

  // ─── Passo 1 — About ──────────────────────────────────────────────────────

  async saveAbout(data: Omit<AboutPayload, 'clientUuid'>): Promise<void> {
    const payload: AboutPayload = { clientUuid: this.clientUuid, ...data };
    await firstValueFrom(
      this.http.post(
        `${environment.apiBaseUrl}/api/v1/about`,
        payload,
        { headers: this.headers }
      )
    );
  }
}
