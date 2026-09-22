import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { MetaEmbeddedSignupService } from '../../whatsapp/meta-embedded-signup.service';
import { WhatsAppIntegration, WhatsAppService } from '../../whatsapp/whatsapp.service';
import { WizardStep6WhatsappComponent } from './wizard-step-6-whatsapp.component';

describe('WhatsApp conditional PIN', () => {
  let component: WizardStep6WhatsappComponent;
  let api: jasmine.SpyObj<WhatsAppService>;
  let meta: jasmine.SpyObj<MetaEmbeddedSignupService>;
  beforeEach(() => {
    api = jasmine.createSpyObj('WhatsAppService', ['complete']);
    meta = jasmine.createSpyObj('MetaEmbeddedSignupService', ['start', 'cancel']);
    meta.start.and.callFake(async (_config, pin) => ({ code: 'temporary', wabaId: '1', phoneNumberId: '2', businessId: null, event: 'FINISH', pin }));
    const auth = { currentProfile: () => ({ roles: ['ADMIN'] }) } as unknown as AuthService;
    component = new WizardStep6WhatsappComponent({} as Router, auth, api, meta);
    component.integration = { configured: false } as WhatsAppIntegration;
    component.configuration = { appId: 'app', configurationId: 'config', graphApiVersion: 'v25.0', sessionInfoEventType: 'WA_EMBEDDED_SIGNUP', coexistenceFinishEvent: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' };
    component.loading.set(false);
  });
  it('starts with a hidden PIN and passes a generated six-digit value', async () => {
    api.complete.and.resolveTo({ configured: true } as WhatsAppIntegration);
    expect(component.pinRequired()).toBeFalse();
    await component.beginConnection();
    expect(meta.start.calls.mostRecent().args[1]).toMatch(/^\d{6}$/);
    expect(component.pin).toBe('');
    expect(component.pinRequired()).toBeFalse();
  });
  it('requests the user PIN only after a specific rejection and opens a fresh signup', async () => {
    api.complete.and.rejectWith(new HttpErrorResponse({ status: 500, error: { message: 'Incorrect PIN' } }));
    await component.beginConnection();
    expect(component.pinRequired()).toBeTrue();
    await component.beginConnection();
    expect(meta.start).toHaveBeenCalledTimes(1);
    component.pin = '012345';
    api.complete.and.resolveTo({ configured: true } as WhatsAppIntegration);
    await component.beginConnection();
    expect(meta.start.calls.mostRecent().args[1]).toBe('012345');
    expect(component.pinRequired()).toBeFalse();
    expect(component.pin).toBe('');
  });
  it('does not request a PIN for unrelated API errors', async () => {
    api.complete.and.rejectWith(new HttpErrorResponse({ status: 400, error: { message: 'Meta app configuration is incomplete' } }));
    await component.beginConnection();
    expect(component.pinRequired()).toBeFalse();
    expect(component.error()).not.toContain('PIN');
  });
});
