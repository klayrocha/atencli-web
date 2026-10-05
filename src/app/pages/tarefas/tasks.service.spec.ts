import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../auth/auth.service';
import { TasksService } from './tasks.service';
import { environment } from '../../../environments/environment.development';

describe('TasksService API contract', () => {
  let api: TasksService;
  let http: HttpTestingController;
  const url = `${environment.apiBaseUrl}/api/v1/tasks`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { getToken: () => 'test-token' } }] });
    api = TestBed.inject(TasksService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('sends authenticated bucket filters with the supported maximum size', async () => {
    const result = api.list('TODAY', { priority: 'HIGH', type: 'CALL', assigneeUserUuid: 'user', stageId: 7, mine: false });
    const req = http.expectOne(r => r.url === url);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(req.request.params.get('bucket')).toBe('TODAY');
    expect(req.request.params.get('size')).toBe('200');
    expect(req.request.params.get('stageId')).toBe('7');
    expect(req.request.params.get('priority')).toBe('HIGH');
    expect(req.request.params.get('assigneeUserUuid')).toBe('user');
    expect(req.request.params.get('mine')).toBe('false');
    req.flush([]); expect(await result).toEqual([]);
  });
  it('sends bulk completion as taskIds rather than individual requests', async () => {
    const result = api.bulkComplete([12, 15]);
    const req = http.expectOne(`${url}/bulk-complete`);
    expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual({ taskIds: [12, 15] });
    req.flush([]); await result;
  });
  it('keeps blank assignee in PATCH to remove assignment', async () => {
    const result = api.update(12, { assigneeUserUuid: '' });
    const req = http.expectOne(`${url}/12`);
    expect(req.request.method).toBe('PATCH'); expect(req.request.body).toEqual({ assigneeUserUuid: '' });
    req.flush({ id: 12 }); await result;
  });
});
