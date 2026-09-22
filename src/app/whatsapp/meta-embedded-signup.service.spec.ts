import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { MetaEmbeddedSignupService } from './meta-embedded-signup.service';
import { CompleteSignup, SignupConfig } from './whatsapp.service';

describe('MetaEmbeddedSignupService', () => {
  let service: MetaEmbeddedSignupService;
  let callback: (response: { authResponse?: { code?: string } }) => void;
  let original: typeof window.FB;
  const config: SignupConfig = {
    appId: 'app', configurationId: 'config', graphApiVersion: 'v25.0',
    sessionInfoEventType: 'WA_EMBEDDED_SIGNUP', coexistenceFinishEvent: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
  };
  function message(event = 'FINISH', origin = 'https://www.facebook.com') {
    window.dispatchEvent(new MessageEvent('message', { origin, data: JSON.stringify({
      type: config.sessionInfoEventType, event,
      data: { waba_id: '123', phone_number_id: '456', business_id: '789' },
    }) }));
  }
  beforeEach(() => {
    original = window.FB;
    window.FB = { init: () => {}, login: cb => { callback = cb; } };
    service = new MetaEmbeddedSignupService();
  });
  afterEach(() => { service.cancel(); window.FB = original; });

  for (const codeFirst of [true, false]) {
    it(`waits for both results, codeFirst=${codeFirst}, and ignores duplicates`, fakeAsync(() => {
      const done = jasmine.createSpy('done');
      void service.start(config, '123456').then(done);
      if (codeFirst) callback({ authResponse: { code: 'temporary' } }); else message();
      flushMicrotasks();
      expect(done).not.toHaveBeenCalled();
      if (codeFirst) message(); else callback({ authResponse: { code: 'temporary' } });
      message();
      flushMicrotasks();
      expect(done).toHaveBeenCalledOnceWith({ code: 'temporary', wabaId: '123', phoneNumberId: '456', businessId: '789', event: 'FINISH', pin: '123456' });
    }));
  }
  it('ignores untrusted origins and sends no PIN for coexistence', fakeAsync(() => {
    let result: CompleteSignup | undefined;
    void service.start(config, '123456').then(value => result = value);
    callback({ authResponse: { code: 'temporary' } });
    message('FINISH', 'https://attacker.example');
    flushMicrotasks();
    expect(result).toBeUndefined();
    message(config.coexistenceFinishEvent, 'https://web.facebook.com');
    flushMicrotasks();
    expect(result?.pin).toBeNull();
  }));
  for (const event of ['CANCEL', 'ERROR']) {
    it(`rejects ${event} and permits retry`, fakeAsync(() => {
      const failed = jasmine.createSpy('failed');
      void service.start(config, null).catch(failed);
      message(event);
      flushMicrotasks();
      expect(failed).toHaveBeenCalledTimes(1);
      const done = jasmine.createSpy('done');
      void service.start(config, null).then(done);
      message(); callback({ authResponse: { code: 'retry' } }); flushMicrotasks();
      expect(done).toHaveBeenCalledTimes(1);
    }));
  }
  it('times out and ignores callbacks after cancellation', fakeAsync(() => {
    const failed = jasmine.createSpy('failed');
    void service.start(config, null).catch(failed);
    tick(5 * 60 * 1000);
    expect(failed).toHaveBeenCalledTimes(1);
    callback({ authResponse: { code: 'late' } }); message(); flushMicrotasks();
    expect(failed).toHaveBeenCalledTimes(1);
  }));
  it('removes the message listener on destruction/cancellation', fakeAsync(() => {
    const remove = spyOn(window, 'removeEventListener').and.callThrough();
    void service.start(config, null).catch(() => {});
    service.cancel(); flushMicrotasks();
    expect(remove).toHaveBeenCalledWith('message', jasmine.any(Function));
  }));
});
