import { Router } from '@angular/router';
import { WizardService, ClientAvailabilityOption } from '../wizard-shared/wizard.service';
import { WizardStep4ScheduleComponent } from './wizard-step-4-schedule.component';

describe('Schedule appointment intervals', () => {
  let component: WizardStep4ScheduleComponent;
  let api: jasmine.SpyObj<WizardService>;
  let router: jasmine.SpyObj<Router>;
  const rule = (minutes = 15): ClientAvailabilityOption => ({ id: 1, clientUuid: 'clinic', availabilityType: 'WORKING_HOURS', dayOfWeek: 1, specificDate: null, startTime: '08:00:00', endTime: '19:00:00', description: null, appointmentIntervalMinutes: minutes });
  beforeEach(() => {
    api = jasmine.createSpyObj('WizardService', ['getClientAvailability', 'createAvailability', 'updateAvailability', 'deleteAvailability']);
    api.deleteAvailability.and.resolveTo();
    router = jasmine.createSpyObj('Router', ['navigate']);
    api.getClientAvailability.and.resolveTo([rule()]);
    api.updateAvailability.and.callFake(async (id, request) => ({ ...rule(), ...request, id }));
    component = new WizardStep4ScheduleComponent(router, api);
  });
  it('restores the saved interval and updates the existing rule when disabled', async () => {
    await component.ngOnInit();
    expect(component.intervalEnabled).toBeTrue();
    expect(component.intervalMinutes).toBe(15);
    component.intervalEnabled = false;
    component.changeInterval();
    await component.goNext();
    expect(api.updateAvailability).toHaveBeenCalledWith(1, jasmine.objectContaining({ appointmentIntervalMinutes: 0 }));
    expect(api.createAvailability).not.toHaveBeenCalled();
  });
  it('rejects empty, fractional and out-of-range rest durations', async () => {
    await component.ngOnInit();
    for (const value of [null, 0, -1, 1.5, 121]) {
      component.intervalMinutes = value;
      await component.goNext();
      expect(component.error()).toContain('1 e 120');
    }
    expect(api.updateAvailability).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('preserves differing saved intervals until the user changes the setting', async () => {
    api.getClientAvailability.and.resolveTo([rule(), { ...rule(30), id: 2, dayOfWeek: 2 }]);
    await component.ngOnInit();
    expect(component.mixedIntervals).toBeTrue();
    await component.goNext();
    expect(api.updateAvailability).not.toHaveBeenCalled();
    component.intervalMinutes = 20;
    component.changeInterval();
    await component.goNext();
    expect(api.updateAvailability).toHaveBeenCalledTimes(2);
    expect(api.updateAvailability.calls.allArgs().every(([, request]) => request.appointmentIntervalMinutes === 20)).toBeTrue();
  });
  it('prevents saving when loading existing settings fails', async () => {
    api.getClientAvailability.and.rejectWith(new Error('offline'));
    await component.ngOnInit();
    await component.goNext();
    expect(component.loadFailed()).toBeTrue();
    expect(api.createAvailability).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('deletes saved hours when a weekday is unchecked and restores it closed', async () => {
    await component.ngOnInit();
    component.days[0].active = false;
    await component.goNext();
    expect(api.deleteAvailability).toHaveBeenCalledOnceWith(1);
    expect(api.createAvailability).not.toHaveBeenCalled();
    expect(component.savedAvailability).toEqual([]);
    api.getClientAvailability.and.resolveTo([]);
    await component.ngOnInit();
    expect(component.days.every(day => !day.active)).toBeTrue();
  });
  it('deletes breaks before all working periods while preserving date exceptions', async () => {
    const exception = { ...rule(), id: 4, dayOfWeek: null, specificDate: '2026-10-01' };
    api.getClientAvailability.and.resolveTo([
      rule(), { ...rule(), id: 2, availabilityType: 'BREAK', startTime: '12:00:00', endTime: '13:00:00' },
      { ...rule(), id: 3, startTime: '20:00:00', endTime: '21:00:00' }, exception,
    ]);
    await component.ngOnInit();
    component.days[0].active = false;
    await component.goNext();
    expect(api.deleteAvailability.calls.allArgs()).toEqual([[2], [1], [3]]);
    expect(component.savedAvailability).toEqual([exception]);
  });
  it('stays on the page after deletion fails and retries only pending deletions', async () => {
    api.getClientAvailability.and.resolveTo([rule(), { ...rule(), id: 2, dayOfWeek: 2 }]);
    await component.ngOnInit();
    component.days.forEach(day => day.active = false);
    api.deleteAvailability.and.callFake(async id => { if (id === 2) throw new Error('offline'); });
    await component.goNext();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.error()).toBeTruthy();
    expect(component.savedAvailability.map(item => item.id)).toEqual([2]);
    api.deleteAvailability.calls.reset();
    api.deleteAvailability.and.resolveTo();
    await component.goNext();
    expect(api.deleteAvailability).toHaveBeenCalledOnceWith(2);
    expect(router.navigate).toHaveBeenCalled();
  });
});
