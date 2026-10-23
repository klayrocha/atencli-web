import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { WizardStep7InstagramComponent } from './wizard-step-7-instagram.component';

describe('Instagram OAuth popup', () => {
  let component: WizardStep7InstagramComponent;
  let api: { getOAuthConfig: jasmine.Spy };
  let popup: Window;
  beforeEach(() => {
    api = { getOAuthConfig: jasmine.createSpy().and.resolveTo({ appId: '123', scopes: ['instagram_business_basic'] }) };
    component = new WizardStep7InstagramComponent(
      { navigate: jasmine.createSpy().and.resolveTo(true) } as any,
      { snapshot: { queryParamMap: convertToParamMap({}) } } as any,
      { currentProfile: () => ({ roles: ['ADMIN'] }) } as any, api as any);
    component.loading.set(false);
    popup = { closed: false, close: jasmine.createSpy(), location: { href: '' } } as unknown as Window;
  });
  afterEach(() => {
    component.ngOnDestroy();
    sessionStorage.removeItem('atenclin:instagram-oauth-state');
  });
  it('reports a blocked popup without starting authorization', async () => {
    spyOn(window, 'open').and.returnValue(null);
    await component.beginConnection();
    expect(api.getOAuthConfig).not.toHaveBeenCalled();
    expect(component.error()).toContain('Permita pop-ups');
    expect(component.starting()).toBeFalse();
  });
  it('opens before loading configuration and accepts only the expected window and state', fakeAsync(() => {
    const open = spyOn(window, 'open').and.returnValue(popup);
    const exchange = spyOn(component, 'exchangeCode').and.resolveTo();
    void component.beginConnection();
    expect(open).toHaveBeenCalledWith('about:blank', 'atenclin-instagram-oauth', jasmine.any(String));
    expect(popup.location.href).toBe('');
    flushMicrotasks();
    const url = new URL(popup.location.href);
    expect(url.origin).toBe('https://www.instagram.com');
    const data = { type: 'atenclin:instagram-oauth', code: 'code', state: url.searchParams.get('state') };
    const send = (origin: string) => {
      const event = new MessageEvent('message', { origin, data });
      Object.defineProperty(event, 'source', { value: popup });
      window.dispatchEvent(event);
    };
    send('https://attacker.example');
    expect(exchange).not.toHaveBeenCalled();
    send(window.location.origin);
    flushMicrotasks();
    expect(exchange).toHaveBeenCalledOnceWith('code', data.state!);
    expect(popup.close).toHaveBeenCalled();
    expect(component.starting()).toBeFalse();
  }));
  it('allows retry when the popup is closed', fakeAsync(() => {
    spyOn(window, 'open').and.returnValue(popup);
    void component.beginConnection();
    flushMicrotasks();
    Object.defineProperty(popup, 'closed', { value: true });
    tick(500);
    flushMicrotasks();
    expect(component.starting()).toBeFalse();
    expect(component.error()).toContain('encerrada');
  }));
});
