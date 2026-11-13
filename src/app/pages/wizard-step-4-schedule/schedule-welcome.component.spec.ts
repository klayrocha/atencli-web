import { ConfigurationWelcomeComponent } from '../wizard-shared/configuration-welcome.component';

describe('Schedule welcome visit limit', () => {
  const key = 'atenclin:schedule-welcome:views:v1';
  beforeEach(() => localStorage.removeItem(key));
  afterEach(() => localStorage.removeItem(key));

  it('counts IA visits independently from schedule visits', () => {
    const aiKey = 'atenclin:ai-welcome:views:v1';
    localStorage.removeItem(aiKey);
    try {
      localStorage.setItem(key, '3');
      for (let visit = 1; visit <= 4; visit++) {
        const component = new ConfigurationWelcomeComponent();
        component.kind = 'ai';
        component.ngOnInit();
        expect(component.visible()).toBe(visit <= 3);
        expect(component.message.title).toContain('A Atenclin pensou em você');
      }
      expect(localStorage.getItem(key)).toBe('3');
      expect(localStorage.getItem(aiKey)).toBe('3');
    } finally { localStorage.removeItem(aiKey); }
  });

  it('shows the notice on exactly three visits and hides it on subsequent visits', () => {
    for (let visit = 1; visit <= 5; visit++) {
      const component = new ConfigurationWelcomeComponent();
      component.ngOnInit();
      expect(component.visible()).toBe(visit <= 3);
      expect(localStorage.getItem(key)).toBe(String(Math.min(visit, 3)));
    }
  });

  it('does not count dismissing the notice as another visit', () => {
    const component = new ConfigurationWelcomeComponent();
    component.ngOnInit();
    component.visible.set(false);
    expect(localStorage.getItem(key)).toBe('1');
  });

  it('recovers from invalid stored counts', () => {
    localStorage.setItem(key, 'invalid');
    const component = new ConfigurationWelcomeComponent();
    component.ngOnInit();
    expect(component.visible()).toBeTrue();
    expect(localStorage.getItem(key)).toBe('1');
  });

  it('does not block the schedule if localStorage is unavailable', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('blocked');
    const component = new ConfigurationWelcomeComponent();
    expect(() => component.ngOnInit()).not.toThrow();
    expect(component.visible()).toBeTrue();
  });
});
