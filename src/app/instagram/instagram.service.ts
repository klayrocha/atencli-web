import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment.development';

export interface InstagramOAuthConfig {
  appId: string;
  graphApiVersion: string;
  scopes: string[];
}

export interface InstagramAccount {
  instagramUserId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  pageId: string | null;
  pageName: string | null;
}

export interface InstagramOAuthAccountsResponse {
  connectionToken: string;
  tokenExpiresAt: string | null;
  accounts: InstagramAccount[];
}

export interface InstagramIntegration {
  id: number | null;
  instagramUserId: string | null;
  pageId: string | null;
  username: string | null;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | null;
  enabled: boolean;
  tokenExpiresAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class InstagramService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/instagram`;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private get options() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }
  getIntegration() { return firstValueFrom(this.http.get<InstagramIntegration>(`${this.url}/integration`, this.options)); }
  getOAuthConfig() { return firstValueFrom(this.http.get<InstagramOAuthConfig>(`${this.url}/oauth/config`, this.options)); }
  getOAuthAccounts(code: string, redirectUri: string) {
    return firstValueFrom(this.http.post<InstagramOAuthAccountsResponse>(`${this.url}/oauth/accounts`, { code, redirectUri }, this.options));
  }
  connect(connectionToken: string, instagramUserId: string) {
    return firstValueFrom(this.http.post<InstagramIntegration>(`${this.url}/oauth/connect`, { connectionToken, instagramUserId }, this.options));
  }
  setEnabled(enabled: boolean) {
    return firstValueFrom(this.http.patch<InstagramIntegration>(`${this.url}/integration/status`, { enabled }, this.options));
  }
}
