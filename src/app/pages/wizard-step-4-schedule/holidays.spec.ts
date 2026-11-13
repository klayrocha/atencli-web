import { Router } from '@angular/router';
import { ClientAvailabilityOption, NationalHoliday, WizardService } from '../wizard-shared/wizard.service';
import { WizardStep4ScheduleComponent } from './wizard-step-4-schedule.component';

describe('Schedule national holidays', () => {
  let component: WizardStep4ScheduleComponent;
  let api: jasmine.SpyObj<WizardService>;
  // 2099-02-23 é segunda (Carnaval), 2099-04-10 é sexta (Sexta-feira Santa), 2099-12-25 é sexta (Natal).
  const holidays: NationalHoliday[] = [
    { date: '2099-02-23', name: 'Carnaval (segunda-feira)', optional: true, blockedAutomatically: false, nonWorkingDayId: null },
    { date: '2099-04-10', name: 'Sexta-feira Santa', optional: false, blockedAutomatically: true, nonWorkingDayId: null },
    { date: '2099-11-15', name: 'Proclamação da República', optional: false, blockedAutomatically: true, nonWorkingDayId: null },
    { date: '2099-12-25', name: 'Natal', optional: false, blockedAutomatically: true, nonWorkingDayId: null },
  ];
  const weekday = (day: number): ClientAvailabilityOption => ({ id: day, clientUuid: 'clinic', availabilityType: 'WORKING_HOURS',
    dayOfWeek: day, specificDate: null, startTime: '08:00:00', endTime: '18:00:00', description: null, appointmentIntervalMinutes: 0 });
  const lunch = (day: number): ClientAvailabilityOption => ({ ...weekday(day), id: 10 + day, availabilityType: 'BREAK',
    startTime: '12:00:00', endTime: '13:00:00', description: 'Pausa para almoço' });

  beforeEach(() => {
    api = jasmine.createSpyObj('WizardService', ['getClientAvailability', 'createAvailability', 'updateAvailability',
      'deleteAvailability', 'getHolidaySettings', 'updateHolidaySettings', 'getNationalHolidays']);
    // Segunda a sexta com almoço; 2099-11-15 é domingo, sem expediente.
    api.getClientAvailability.and.resolveTo([1, 2, 3, 4, 5].flatMap(day => [weekday(day), lunch(day)]));
    api.getHolidaySettings.and.resolveTo({ source: 'GOOGLE', blockNationalHolidays: true });
    api.updateHolidaySettings.and.callFake(async settings => settings);
    api.getNationalHolidays.and.resolveTo(holidays);
    api.createAvailability.and.callFake(async request => ({ ...weekday(1), ...request, id: 500, dayOfWeek: null,
      specificDate: request.specificDate ?? null, startTime: null, endTime: null, description: request.description ?? null }));
    component = new WizardStep4ScheduleComponent(jasmine.createSpyObj('Router', ['navigate']) as Router, api);
  });

  it('loads the setting and shows which holidays are closed', async () => {
    await component.ngOnInit();

    expect(component.holidaySettings).not.toBeNull();
    expect(api.getNationalHolidays).toHaveBeenCalledWith(new Date().getFullYear());
    expect(component.holidays.map(holiday => component.holidayStatus(holiday)))
      .toEqual(['OPEN', 'AUTO_CLOSED', 'AUTO_CLOSED', 'AUTO_CLOSED']);
    expect(component.configurationChanges.hasChanges()).toBeFalse();
  });

  it('with automatic blocking closes only pontos facultativos as exceptions', async () => {
    await component.ngOnInit();

    component.closeAllHolidays();

    expect(component.exceptions.map(item => [item.date, item.type, item.description]))
      .toEqual([['2099-02-23', 'CLOSED', 'Feriado: Carnaval (segunda-feira)']]);
    expect(component.closableHolidayCount).toBe(0);
    expect(component.configurationChanges.hasChanges()).toBeTrue();
    expect(await component.saveConfiguration()).toBeTrue();
    expect(api.createAvailability).toHaveBeenCalledWith({ availabilityType: 'NON_WORKING_DAY',
      specificDate: '2099-02-23', description: 'Feriado: Carnaval (segunda-feira)' });
    expect(api.updateHolidaySettings).not.toHaveBeenCalled();
  });

  it('without automatic blocking closes every holiday on a working day and saves the setting', async () => {
    await component.ngOnInit();
    component.blockNationalHolidays = false;

    expect(component.holidayStatus(holidays[2])).toBe('DAY_OFF');
    component.closeAllHolidays();

    expect(component.exceptions.map(item => item.date)).toEqual(['2099-02-23', '2099-04-10', '2099-12-25']);
    expect(await component.saveConfiguration()).toBeTrue();
    expect(api.updateHolidaySettings).toHaveBeenCalledWith({ source: 'GOOGLE', blockNationalHolidays: false });
    expect(component.configurationChanges.hasChanges()).toBeFalse();
  });

  it('closing one holiday and removing the exception reopens it', async () => {
    await component.ngOnInit();
    component.blockNationalHolidays = false;

    component.closeHoliday(holidays[3]);
    expect(component.holidayStatus(holidays[3])).toBe('EXCEPTION_CLOSED');
    component.removeException(component.exceptions[0].id);
    expect(component.holidayStatus(holidays[3])).toBe('OPEN');
  });

  it('hides the section without blocking the schedule when the setting cannot be loaded', async () => {
    api.getHolidaySettings.and.rejectWith(new Error('forbidden'));

    await component.ngOnInit();

    expect(component.holidaySettings).toBeNull();
    expect(component.loadFailed()).toBeFalse();
    expect(api.getNationalHolidays).not.toHaveBeenCalled();
    expect(await component.saveConfiguration()).toBeTrue();
    expect(api.updateHolidaySettings).not.toHaveBeenCalled();
  });
  it('does not request holidays from an older API and preserves normal schedule editing', async () => {
    api.getHolidaySettings.and.resolveTo({ source: 'INTERNAL' } as Awaited<ReturnType<WizardService['getHolidaySettings']>>);
    await component.ngOnInit();
    expect(component.holidaySettings).toBeNull();
    expect(component.loadFailed()).toBeFalse();
    expect(api.getNationalHolidays).not.toHaveBeenCalled();
    expect(await component.saveConfiguration()).toBeTrue();
    expect(api.updateHolidaySettings).not.toHaveBeenCalled();
  });
});
