import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.development';

function token(expSecondsFromNow: number): string {
  const payload = btoa(JSON.stringify({ sub: 'ana@clinic.com', exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }))
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${payload}.signature`;
}

describe('AuthService logout', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  afterEach(() => { http.verify(); sessionStorage.clear(); });

  it('ends the session on the server and clears it locally', () => {
    const current = token(600);
    sessionStorage.setItem('ch_token', current);

    auth.logout();

    const request = http.expectOne(`${environment.apiBaseUrl}/api/v1/auth/logout`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${current}`);
    expect(sessionStorage.getItem('ch_token')).toBeNull();
    request.flush(null, { status: 401, statusText: 'Unauthorized' }); // a failure does not undo the local logout
    expect(sessionStorage.getItem('ch_token')).toBeNull();
  });

  it('does not call the server without a valid token', () => {
    sessionStorage.setItem('ch_token', token(-60));
    auth.logout();
    http.expectNone(`${environment.apiBaseUrl}/api/v1/auth/logout`);
    expect(sessionStorage.getItem('ch_token')).toBeNull();
  });
});
