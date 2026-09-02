import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment.development';

// ─── Modelos ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email';
}

export interface UserProfile {
  userUuid: string;
  clientUuid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  languageCode: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly STORAGE_KEY   = 'ch_user';
  private readonly TOKEN_KEY     = 'ch_token';
  private readonly PROFILE_KEY   = 'ch_profile';

  // Estado reativo
  readonly currentUser    = signal<User | null>(this.loadFromStorage());
  readonly currentProfile = signal<UserProfile | null>(this.loadProfileFromStorage());
  readonly loading        = signal(false);
  readonly error          = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // ─── Getter do token armazenado ───────────────────────────────────────────

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // ─── Login via e-mail / senha → POST /api/v1/auth ────────────────────────

  async loginWithEmail(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const body: LoginRequest = { email, password };

      // A API retorna o token no header Authorization, não no body
      const response: HttpResponse<string> = await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/api/v1/auth`, body, { observe: 'response', responseType: 'text' })
      ) as HttpResponse<string>;

      const authHeader = response.headers.get('Authorization');
      if (!authHeader) {
        this.error.set('Resposta inválida do servidor.');
        return;
      }

      // Header vem como "Bearer <token>"
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      const payload = this.decodeJwt(token);
      const user: User = {
        id:       payload.userUuid ?? payload.sub,
        name:     payload.name ?? email,
        email:    payload.sub,
        provider: 'email',
      };

      this.setSession(user, token);
      await this.fetchAndStoreProfile(payload.userUuid ?? payload.sub, token);
      this.router.navigate(['/']);

    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 || err.status === 403) {
          this.error.set('E-mail ou senha incorretos.');
        } else {
          this.error.set(`Erro ao conectar com o servidor (${err.status}).`);
        }
      } else {
        this.error.set('Erro inesperado. Tente novamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Cadastro de usuário → POST /api/v1/user ─────────────────────────────

  async registerUser(data: RegisterRequest): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/api/v1/user`, data)
    );
  }

  // ─── Alterar senha ────────────────────────────────────────────────────────

  async changePassword(currentPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    const token = this.getToken();
    const response: HttpResponse<string> = await firstValueFrom(
      this.http.post(
        `${environment.apiBaseUrl}/api/v1/user/password/change`,
        { currentPassword, newPassword, confirmNewPassword },
        { observe: 'response', responseType: 'text', headers: { Authorization: `Bearer ${token}` } }
      )
    ) as HttpResponse<string>;
    // Backend retorna novo token no header Authorization após a troca
    const newToken = response.headers.get('Authorization');
    if (newToken) {
      const raw = newToken.startsWith('Bearer ') ? newToken.slice(7) : newToken;
      sessionStorage.setItem(this.TOKEN_KEY, raw);
    }
  }

  // ─── Esqueceu senha ───────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/api/v1/user/forgot-password`, { email })
    ).catch(() => {
      // Silencia erros intencionalmente: o backend não expõe se o e-mail existe
    });
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  /** Redireciona para o fluxo OAuth2 do backend */
  loginWithGoogle(): void {
    window.location.href = `${environment.apiBaseUrl}/oauth2/authorization/google`;
  }

  /** Processa o token recebido no callback do OAuth2 */
  async handleGoogleCallback(token: string): Promise<void> {
    try {
      const payload = this.decodeJwt(token);
      const user: User = {
        id:       payload.userUuid ?? payload.sub,
        name:     payload.name ?? payload.sub,
        email:    payload.sub,
        provider: 'google',
      };
      this.setSession(user, token);
      await this.fetchAndStoreProfile(payload.userUuid ?? payload.sub, token);
      this.router.navigate(['/']);
    } catch {
      this.router.navigate(['/login']);
    }
  }

  /** Busca os dados completos do usuário na API e persiste em sessão */
  async fetchAndStoreProfile(userUuid: string, token: string): Promise<void> {
    try {
      const profile = await firstValueFrom(
        this.http.get<UserProfile>(`${environment.apiBaseUrl}/api/v1/user/${userUuid}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      this.currentProfile.set(profile as UserProfile);
      sessionStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // não bloqueia o login caso o endpoint falhe
    }
  }

  // ─── Utilitários ──────────────────────────────────────────────────────────

  logout(): void {
    this.currentUser.set(null);
    this.currentProfile.set(null);
    sessionStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.PROFILE_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeJwt(token);
      // exp está em segundos; Date.now() em milissegundos
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private setSession(user: User, token: string): void {
    this.currentUser.set(user);
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  private loadFromStorage(): User | null {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private loadProfileFromStorage(): UserProfile | null {
    try {
      const raw = sessionStorage.getItem(this.PROFILE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }

  private decodeJwt(token: string): any {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  }
}
