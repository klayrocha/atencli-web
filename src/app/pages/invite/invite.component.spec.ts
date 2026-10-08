import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { InviteComponent } from './invite.component';
import { InvitationDetailsResponse, WizardService } from '../wizard-shared/wizard.service';
import { routes } from '../../app.routes';

const invitation: InvitationDetailsResponse = { clinicName: 'Clínica teste', invitedName: 'Pessoa convidada', maskedEmail: 'p***@example.com', role: 'ATTENDANT', authProvider: 'LOCAL', status: 'PENDING', expiresAt: '2030-01-01T12:00:00Z' };
describe('Public invitation flow', () => {
  let component: InviteComponent;
  let api: jasmine.SpyObj<WizardService>;
  beforeEach(async () => {
    api = jasmine.createSpyObj('WizardService', ['getInvitationDetails', 'acceptLocalInvitation', 'startGoogleInvitation']);
    api.getInvitationDetails.and.resolveTo(invitation);
    api.acceptLocalInvitation.and.resolveTo();
    component = new InviteComponent({ paramMap: of(convertToParamMap({ token: 'test-token' })) } as ActivatedRoute, api);
    component.ngOnInit();
    await component.load();
  });
  afterEach(() => component.ngOnDestroy());
  it('registers the invitation outside both authentication guards', () => {
    const route = routes.find(r => r.path === 'invite/:token');
    expect(route).toBeDefined(); expect(route?.canActivate).toBeUndefined(); expect(route?.loadComponent).toBeDefined();
  });
  it('loads invitation details without accepting on page opening', () => {
    expect(api.getInvitationDetails).toHaveBeenCalledWith('test-token');
    expect(component.invitation?.clinicName).toBe('Clínica teste');
    expect(api.acceptLocalInvitation).not.toHaveBeenCalled();
  });
  it('blocks expired, cancelled and already accepted invitations', async () => {
    component.password = component.confirmation = 'TestPassword123';
    for (const status of ['EXPIRED', 'CANCELLED', 'ACCEPTED'] as const) {
      component.invitation = { ...invitation, status };
      await component.accept(); component.acceptGoogle();
      expect(component.statusMessage).toBeTruthy();
    }
    expect(api.acceptLocalInvitation).not.toHaveBeenCalled(); expect(api.startGoogleInvitation).not.toHaveBeenCalled();
  });
  it('requires matching valid passwords and clears them after confirmation', async () => {
    component.password = 'TestPassword123'; component.confirmation = 'different';
    await component.accept(); expect(api.acceptLocalInvitation).not.toHaveBeenCalled();
    component.confirmation = component.password;
    await component.accept();
    expect(api.acceptLocalInvitation).toHaveBeenCalledOnceWith('test-token', 'TestPassword123');
    expect(component.accepted).toBeTrue(); expect(component.password).toBe('');
  });
  it('uses the invitation-specific Google endpoint', () => {
    component.invitation = { ...invitation, authProvider: 'GOOGLE' };
    component.acceptGoogle(); expect(api.startGoogleInvitation).toHaveBeenCalledOnceWith('test-token');
  });
  it('shows a recoverable error on connection failure', async () => {
    api.getInvitationDetails.and.rejectWith({ status: 0 }); await component.load();
    expect(component.loading).toBeFalse(); expect(component.invitation).toBeNull(); expect(component.error).toContain('Tente novamente');
  });
});
describe('Invitation public HTTP requests', () => {
  it('does not attach authorization to validation or acceptance', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(WizardService); const http = TestBed.inject(HttpTestingController);
    const details = api.getInvitationDetails('test-token');
    const get = http.expectOne(r => r.url.endsWith('/api/v1/invitations/test-token'));
    expect(get.request.headers.has('Authorization')).toBeFalse(); get.flush(invitation); await details;
    const accepted = api.acceptLocalInvitation('test-token', 'TestPassword123');
    const post = http.expectOne(r => r.url.endsWith('/api/v1/invitations/test-token/accept-local'));
    expect(post.request.headers.has('Authorization')).toBeFalse(); expect(post.request.body).toEqual({ password: 'TestPassword123' });
    post.flush({}); await accepted; http.verify();
  });
});
