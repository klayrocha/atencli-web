import { Router } from '@angular/router';
import { WizardStep6ProfessionalsComponent } from './wizard-step-6-professionals.component';
import { ClinicProfessional, ProfessionalsService } from '../agenda/professionals.service';
import { CalendarService } from '../agenda/calendar.service';
import { WizardService } from '../wizard-shared/wizard.service';

describe('Professional configuration', () => {
  let component: WizardStep6ProfessionalsComponent;
  let api: jasmine.SpyObj<ProfessionalsService>;
  const saved: ClinicProfessional = { uuid: 'mauro', fullName: 'Mauro', active: true, serviceIds: [7], hours: [], timeOff: [] };
  beforeEach(() => {
    api = jasmine.createSpyObj('ProfessionalsService', ['list', 'create', 'update']);
    api.create.and.resolveTo(saved); api.update.and.resolveTo(saved);
    component = new WizardStep6ProfessionalsComponent(api, {} as WizardService, {} as CalendarService, {} as Router);
    component.loaded = true;
    component.services = [{ id: 7, name: 'Consulta', defaultValue: null, price: 100, planPrice: null, durationMinutes: 30 }];
    component.edit(); component.fullName = 'Mauro'; component.serviceIds = [7];
  });
  it('saves services, inherited hours and time off in the clinic time zone', async () => {
    component.zone = 'America/Sao_Paulo';
    component.timeOff = [{ startsAt: '2026-10-20T09:00', endsAt: '2026-10-20T10:00' }];
    await component.save();
    expect(api.create).toHaveBeenCalledWith(jasmine.objectContaining({ fullName: 'Mauro', serviceIds: [7], hours: [],
      timeOff: [{ startsAt: '2026-10-20T12:00:00.000Z', endsAt: '2026-10-20T13:00:00.000Z' }] }));
    expect(component.professionals).toEqual([saved]); expect(component.editing).toBeFalse();
  });
  it('rejects overlapping hours before calling the API', async () => {
    component.inheritHours = false;
    component.hours = [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }, { dayOfWeek: 1, startTime: '11:00', endTime: '13:00' }];
    await component.save();
    expect(api.create).not.toHaveBeenCalled(); expect(component.error).toContain('sobrepor');
  });
  it('keeps editing data after a failed save', async () => {
    api.create.and.rejectWith({ status: 500 });
    await component.save();
    expect(component.editing).toBeTrue(); expect(component.fullName).toBe('Mauro');
    expect(component.saving).toBeFalse(); expect(component.error).toBeTruthy();
  });
  it('deactivates through a partial update without replacing services or schedules', async () => {
    api.update.and.resolveTo({ ...saved, active: false }); component.professionals = [saved];
    await component.toggleActive(saved);
    expect(api.update).toHaveBeenCalledWith('mauro', { active: false });
    expect(component.professionals[0].active).toBeFalse();
  });
});
