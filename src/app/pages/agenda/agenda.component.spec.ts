import { ActivatedRoute } from '@angular/router';
import { AgendaComponent } from './agenda.component';
import { Appointment, CalendarEvent, CalendarService } from './calendar.service';
import { WizardService } from '../wizard-shared/wizard.service';

describe('Agenda workflows', () => {
  let component: AgendaComponent;
  let api: jasmine.SpyObj<CalendarService>;
  const appointment = { id: 1, contactName: 'Paciente', serviceId: 4, serviceName: 'Consulta', status: 'CONFIRMED', startsAt: '2026-09-21T08:00:00-03:00', endsAt: '2026-09-21T08:45:00-03:00' } as Appointment;
  beforeEach(() => {
    api = jasmine.createSpyObj('CalendarService', ['events', 'appointments', 'create', 'reschedule', 'slots']);
    api.events.and.resolveTo([]); api.appointments.and.resolveTo([]); api.create.and.resolveTo(appointment); api.reschedule.and.resolveTo(appointment);
    component = new AgendaComponent(api, {} as WizardService, {} as ActivatedRoute);
    component.config = { source: 'INTERNAL', timeZone: 'America/Sao_Paulo', googleConnected: false, googleCalendarId: null };
    component.anchor = '2026-09-21';
  });
  it('preserves the exact offset supplied by the availability endpoint', async () => {
    component.slotService = '4'; component.slotProfessional = 'professional';
    component.chooseSlot({ startsAt: appointment.startsAt, endsAt: appointment.endsAt });
    component.form.name = 'Paciente';
    await component.save();
    expect(api.create).toHaveBeenCalledWith(jasmine.objectContaining({ startsAt: appointment.startsAt, serviceId: 4, professionalUserUuid: 'professional' }));
  });
  it('preserves appointment duration when rescheduling', async () => {
    component.openAppointment(appointment); component.rescheduleAt = '2026-09-22T14:00';
    await component.reschedule();
    expect(api.reschedule).toHaveBeenCalledWith(1, '2026-09-22T17:00:00.000Z', '2026-09-22T17:45:00.000Z');
  });
  it('keeps the form open on an occupied-slot conflict', async () => {
    api.create.and.rejectWith({ status: 409 });
    component.openCreate(); component.form.name = 'Paciente'; component.form.serviceId = '4';
    await component.save();
    expect(component.editor).toBeTrue(); expect(component.modalError).toContain('não está mais disponível');
  });
  it('rejects a reversed block interval before sending it', async () => {
    component.openCreate(true); component.form.name = 'Reunião'; component.form.endsAt = '2026-09-21T08:00';
    await component.save(); expect(api.create).not.toHaveBeenCalled();
  });
  it('places overlapping events into separate columns', () => {
    const first = { id: 'a', startsAt: appointment.startsAt, endsAt: appointment.endsAt } as CalendarEvent;
    const second = { ...first, id: 'b' };
    component.events = [first, second];
    expect(component.eventStyle(first, component.anchor).left).not.toBe(component.eventStyle(second, component.anchor).left);
    expect(component.eventStyle(first, component.anchor).width).toBe('calc(50% - 6px)');
  });
  it('does not apply stale availability after filters change', async () => {
    let resolve!: (value: { startsAt: string; endsAt: string }[]) => void;
    api.slots.and.returnValue(new Promise(r => resolve = r));
    component.slotService = '4'; component.slotDay = '2026-09-21';
    const loading = component.findSlots(); component.clearSlots();
    resolve([{ startsAt: appointment.startsAt, endsAt: appointment.endsAt }]); await loading;
    expect(component.slots).toEqual([]); expect(component.slotsSearched).toBeFalse();
  });
});
