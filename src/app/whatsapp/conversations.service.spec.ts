import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConversationsService } from './conversations.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment.development';

describe('ConversationsService HTTP contract', () => {
  let service: ConversationsService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/v1/whatsapp`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { getToken: () => 'test-token' } }] });
    service = TestBed.inject(ConversationsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses authenticated server-side filtering and pagination', async () => {
    const result = service.list('unassigned', 2);
    const request = http.expectOne(r => r.url === `${base}/conversations`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.params.get('responsibilityStatus')).toBe('UNASSIGNED');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ content: [], page: { number: 2, size: 50, totalElements: 0, totalPages: 0 } });
    await result;
  });
  it('sends only the recipient and message text to the send endpoint', async () => {
    const result = service.send('5561999998888', 'Olá');
    const request = http.expectOne(`${base}/messages`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ to: '5561999998888', text: 'Olá' });
    request.flush({ id: 1, status: 'SENT' });
    await result;
  });
});
