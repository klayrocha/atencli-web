import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, convertToParamMap, provideRouter } from '@angular/router';
import { SubscriptionJourneyService } from '../pages/subscription/subscription-journey.service';
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

describe('Authentication resumes the subscription journey', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let router: Router;
  let journey: SubscriptionJourneyService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    journey = TestBed.inject(SubscriptionJourneyService);
    journey.clear();
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(auth, 'fetchAndStoreProfile').and.resolveTo();
  });
  afterEach(() => { http.verify(); sessionStorage.clear(); journey.clear(); });

  it('continues to the selected annual plan after email login', async () => {
    journey.capture(convertToParamMap({ plan: 'PROFESSIONAL', billing: 'YEARLY' }));
    const pending = auth.loginWithEmail('ana@clinic.com', 'test-only');
    http.expectOne(`${environment.apiBaseUrl}/api/v1/auth`).flush('', { headers: { Authorization: `Bearer ${token(600)}` } });
    await pending;
    expect(router.navigate).toHaveBeenCalledWith(['/subscription'], { queryParams: { plan: 'PROFESSIONAL', billing: 'YEARLY' } });
  });

  it('continues to the selected plan after Google authentication', async () => {
    journey.capture(convertToParamMap({ plan: 'STARTER', billing: 'MONTHLY' }));
    await auth.handleGoogleCallback(token(600));
    expect(router.navigate).toHaveBeenCalledWith(['/subscription'], { queryParams: { plan: 'STARTER', billing: 'MONTHLY' } });
  });

  it('keeps the normal home destination without a plan choice', async () => {
    await auth.handleGoogleCallback(token(600));
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
