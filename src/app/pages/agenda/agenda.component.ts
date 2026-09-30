import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { CalendarService, CalendarConfiguration, CalendarEvent, Appointment, AppointmentStatus, Slot } from './calendar.service';
import { WizardService, ClientProvidedServiceOption, TeamMemberResponse } from '../wizard-shared/wizard.service';
import { addDays, clinicInstant, weekStart, zonedParts } from './calendar-date';

@Component({ selector: 'app-agenda', standalone: true, imports: [CommonModule, FormsModule, RouterLink, DialogModule], templateUrl: './agenda.component.html', styleUrls: ['./agenda.component.scss'] })
export class AgendaComponent implements OnInit {
  config: CalendarConfiguration | null = null;
  services: ClientProvidedServiceOption[] = [];
  team: TeamMemberResponse[] = [];
  events: CalendarEvent[] = [];
  appointments: Appointment[] = [];
  upcoming: Appointment[] = [];
  view: 'day' | 'week' | 'month' = 'week';
  anchor = '';
  professional = '';
  status = '';
  service = '';
  loading = false;
  saving = false;
  error = '';
  notice = '';
  referenceError = '';
  modalError = '';
  editor = false;
  settings = false;
  availability = false;
  details = false;
  selected: Appointment | null = null;
  external: CalendarEvent | null = null;
  rescheduleAt = '';
  slots: Slot[] = [];
  slotsLoading = false;
  slotsSearched = false;
  slotService = '';
  slotProfessional = '';
  slotDay = '';
  private request = 0;
  private slotRequest = 0;
  form = this.blankForm();
  readonly statuses: { value: AppointmentStatus; label: string }[] = [
    { value: 'PENDING_CONFIRMATION', label: 'Pendente' }, { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'RESCHEDULED', label: 'Reagendado' }, { value: 'COMPLETED', label: 'Concluído' },
    { value: 'CANCELLED', label: 'Cancelado' }, { value: 'NO_SHOW', label: 'Não compareceu' }, { value: 'BLOCKED', label: 'Bloqueado' }
  ];
  constructor(private api: CalendarService, private wizard: WizardService, private route: ActivatedRoute) {}
  get zone() { return this.config?.timeZone || 'America/Sao_Paulo'; }
  get today() { return zonedParts(new Date(), this.zone).slice(0, 10); }
  async ngOnInit() {
    const query = this.route.snapshot.queryParamMap;
    if (query.has('error')) this.notice = 'Não foi possível conectar o Google Calendar. Tente novamente em Fonte da agenda.';
    if (query.get('status') === 'connected') this.notice = 'Google Calendar conectado.';
    await this.initialize();
  }
  async initialize() {
    this.loading = true;
    this.error = '';
    try {
      this.config = await this.api.configuration();
      this.anchor = this.today;
      const refs = await Promise.allSettled([this.wizard.getClientServices(), this.wizard.getTeam()]);
      if (refs[0].status === 'fulfilled') this.services = refs[0].value.services;
      if (refs[1].status === 'fulfilled') this.team = refs[1].value.members.filter(m => m.status === 'ACTIVE');
      this.referenceError = refs.some(r => r.status === 'rejected') ? 'Não foi possível carregar serviços ou profissionais. Recarregue a página para tentar novamente.' : '';
      await this.load();
    } catch (error) { this.error = this.message(error); this.loading = false; }
  }
  get days(): string[] {
    if (!this.anchor) return [];
    if (this.view === 'day') return [this.anchor];
    const start = this.view === 'month' ? weekStart(`${this.anchor.slice(0, 7)}-01`) : weekStart(this.anchor);
    return Array.from({ length: this.view === 'month' ? 42 : 7 }, (_, i) => addDays(start, i));
  }
  get periodLabel() {
    if (this.view === 'month') return this.dateLabel(this.anchor, { month: 'long', year: 'numeric' });
    const days = this.days;
    if (!days.length) return '';
    return this.view === 'day' ? this.dateLabel(days[0]) : `${this.dateLabel(days[0], { day: 'numeric', month: 'short' })} – ${this.dateLabel(days[6])}`;
  }
  dateLabel(day: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) { return day ? new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`)) : ''; }
  time(value: string) { return zonedParts(value, this.zone).slice(11); }
  date(value: string) { return zonedParts(value, this.zone).slice(0, 10); }
  label(status: string | null) { return this.statuses.find(s => s.value === status)?.label || 'Google Calendar'; }
  async load() {
    if (!this.config) return;
    const request = ++this.request;
    this.loading = true; this.error = ''; this.events = []; this.appointments = []; this.upcoming = [];
    const days = this.days;
    const from = clinicInstant(`${days[0]}T00:00`, this.zone);
    const to = clinicInstant(`${addDays(days[days.length - 1], 1)}T00:00`, this.zone);
    try {
      const [events, appointments, upcoming] = await Promise.all([
        this.api.events(from, to, this.professional), this.api.appointments(from, to, this.professional),
        this.api.appointments(clinicInstant(`${this.today}T00:00`, this.zone), clinicInstant(`${addDays(this.today, 31)}T00:00`, this.zone), this.professional)
      ]);
      if (request !== this.request) return;
      this.events = events; this.appointments = appointments;
      this.upcoming = upcoming.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    } catch (error) { if (request === this.request) this.error = this.message(error); }
    finally { if (request === this.request) this.loading = false; }
  }
  changeView(view: 'day' | 'week' | 'month') { this.view = view; void this.load(); }
  navigate(direction: number) {
    if (this.view === 'month') {
      const d = new Date(`${this.anchor.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + direction); this.anchor = d.toISOString().slice(0, 10);
    } else this.anchor = addDays(this.anchor, direction * (this.view === 'week' ? 7 : 1));
    void this.load();
  }
  goToday() { this.anchor = this.today; void this.load(); }
  appointment(event: CalendarEvent) { return this.appointments.find(a => a.id === event.appointmentId); }
  matches(a: Appointment) { return (!this.status || a.status === this.status) && (!this.service || String(a.serviceId) === this.service); }
  get filteredEvents() { return this.events.filter(e => (!this.status || e.status === this.status) && (!this.service || String(this.appointment(e)?.serviceId) === this.service)); }
  dayEvents(day: string) { return this.filteredEvents.filter(e => this.date(e.startsAt) <= day && this.date(e.endsAt) >= day && !(this.date(e.endsAt) === day && this.time(e.endsAt) === '00:00')).sort((a,b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)); }
  get nextAppointments() { return this.upcoming.filter(a => this.matches(a) && Date.parse(a.endsAt) > Date.now() && ['CONFIRMED','PENDING_CONFIRMATION','RESCHEDULED'].includes(a.status)).slice(0, 4); }
  get pending() { return this.upcoming.filter(a => this.matches(a) && a.status === 'PENDING_CONFIRMATION' && Date.parse(a.endsAt) > Date.now()).slice(0, 4); }
  get hours() {
    let start = 8, end = 18;
    for (const e of this.filteredEvents) {
      start = Math.min(start, Number(this.time(e.startsAt).slice(0, 2)));
      end = Math.max(end, this.date(e.startsAt) !== this.date(e.endsAt) ? 24 : Math.ceil(this.minutes(e.endsAt) / 60));
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  }
  minutes(value: string) { const [h,m] = this.time(value).split(':').map(Number); return h * 60 + m; }
  eventStyle(event: CalendarEvent, day: string) {
    const events = this.dayEvents(day);
    const start = (e: CalendarEvent) => this.date(e.startsAt) < day ? this.hours[0] * 60 : this.minutes(e.startsAt);
    const end = (e: CalendarEvent) => this.date(e.endsAt) > day ? (this.hours[this.hours.length - 1] + 1) * 60 : this.minutes(e.endsAt);
    // Connected overlap groups share columns, so simultaneous appointments remain selectable.
    const groups: CalendarEvent[][] = [];
    for (const e of events) {
      const last = groups[groups.length - 1];
      if (last && start(e) < Math.max(...last.map(x => Math.max(end(x), start(x) + 45)))) last.push(e); else groups.push([e]);
    }
    const group = groups.find(g => g.includes(event)) || [event];
    const lanes: number[] = []; const assigned = new Map<string, number>();
    for (const e of group) { let lane = lanes.findIndex(v => v <= start(e)); if (lane < 0) lane = lanes.length; lanes[lane] = Math.max(end(e), start(e) + 45); assigned.set(e.id, lane); }
    return { top: `${(start(event) - this.hours[0] * 60) * 1.2}px`, height: `${Math.max(50, (end(event) - start(event)) * 1.2 - 4)}px`, left: `calc(${(assigned.get(event.id) || 0) * 100 / lanes.length}% + 3px)`, width: `calc(${100 / lanes.length}% - 6px)` };
  }
  color(event: CalendarEvent) { if (event.status === 'BLOCKED') return 'tone-block'; const key = this.appointment(event)?.serviceId ?? 3; return `tone-${Math.abs(key) % 4}`; }
  initials(name: string) { return name.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('').toUpperCase(); }
  blankForm() { return { blocked: false, name: '', phone: '', email: '', serviceId: '', professional: '', startsAt: '', endsAt: '', notes: '', status: 'PENDING_CONFIRMATION' as AppointmentStatus, slot: '' }; }
  openCreate(blocked = false, day = this.anchor) { this.form = this.blankForm(); this.form.blocked = blocked; this.form.professional = this.professional; this.form.startsAt = `${day || this.today}T09:00`; this.form.endsAt = `${day || this.today}T10:00`; this.modalError = ''; this.editor = true; }
  openEvent(event: CalendarEvent) { this.selected = this.appointment(event) || null; this.external = event; this.openDetails(); }
  openAppointment(appointment: Appointment) { this.selected = appointment; this.external = null; this.openDetails(); }
  openDetails() { this.rescheduleAt = this.selected ? zonedParts(this.selected.startsAt, this.zone) : ''; this.modalError = ''; this.details = true; }
  async save() {
    this.modalError = '';
    if (!this.form.name.trim() || (!this.form.blocked && !this.form.serviceId)) { this.modalError = 'Preencha o nome e selecione o serviço.'; return; }
    this.saving = true;
    try {
      const startsAt = this.form.slot || clinicInstant(this.form.startsAt, this.zone);
      const endsAt = this.form.blocked ? clinicInstant(this.form.endsAt, this.zone) : undefined;
      if (endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('O fim deve ser posterior ao início.');
      await this.api.create({ contactName: this.form.name.trim(), contactPhone: this.form.phone || undefined, contactEmail: this.form.email || undefined, serviceId: this.form.blocked ? undefined : Number(this.form.serviceId), serviceName: this.form.blocked ? 'Bloqueio de agenda' : undefined, professionalUserUuid: this.form.professional || undefined, startsAt, endsAt, status: this.form.blocked ? 'BLOCKED' : this.form.status, notes: this.form.notes || undefined });
      this.editor = false; this.notice = this.form.blocked ? 'Horário bloqueado.' : 'Agendamento criado.'; await this.load();
    } catch (error) { this.modalError = this.message(error); } finally { this.saving = false; }
  }
  async updateStatus(appointment: Appointment, status: AppointmentStatus) {
    this.saving = true; this.modalError = ''; this.error = '';
    try { await this.api.status(appointment.id, status); this.details = false; this.notice = 'Status atualizado.'; await this.load(); }
    catch (error) { if (this.details) this.modalError = this.message(error); else this.error = this.message(error); }
    finally { this.saving = false; }
  }
  async reschedule() {
    if (!this.selected) return;
    this.saving = true; this.modalError = '';
    try {
      const start = clinicInstant(this.rescheduleAt, this.zone);
      const duration = Date.parse(this.selected.endsAt) - Date.parse(this.selected.startsAt);
      await this.api.reschedule(this.selected.id, start, new Date(Date.parse(start) + duration).toISOString());
      this.details = false; this.notice = 'Consulta reagendada.'; await this.load();
    } catch (error) { this.modalError = this.message(error); } finally { this.saving = false; }
  }
  openSlots() { this.slotRequest++; this.slotsLoading = false; this.slotService = this.service; this.slotProfessional = this.professional; this.slotDay = this.today; this.slots = []; this.slotsSearched = false; this.modalError = ''; this.availability = true; }
  clearSlots() { this.slotRequest++; this.slots = []; this.slotsLoading = false; this.slotsSearched = false; }
  async findSlots() {
    if (!this.slotService || !this.slotDay) { this.modalError = 'Selecione o serviço e a data inicial.'; return; }
    const request = ++this.slotRequest; this.slotsLoading = true; this.slots = []; this.modalError = ''; this.slotsSearched = false;
    try {
      const slots = await this.api.slots(clinicInstant(`${this.slotDay}T00:00`, this.zone), clinicInstant(`${addDays(this.slotDay, 7)}T00:00`, this.zone), Number(this.slotService), this.slotProfessional);
      if (request === this.slotRequest) { this.slots = slots; this.slotsSearched = true; }
    } catch (error) { if (request === this.slotRequest) this.modalError = this.message(error); }
    finally { if (request === this.slotRequest) this.slotsLoading = false; }
  }
  chooseSlot(slot: Slot) { this.availability = false; this.openCreate(); this.form.serviceId = this.slotService; this.form.professional = this.slotProfessional; this.form.startsAt = zonedParts(slot.startsAt, this.zone); this.form.slot = slot.startsAt; }
  async source(action: 'connect' | 'disconnect' | 'internal') {
    this.saving = true; this.modalError = '';
    try {
      if (action === 'connect') { const response = await this.api.connect(); const url = new URL(response.authorizationUrl); if (url.protocol !== 'https:') throw new Error('URL de autorização inválida.'); window.location.assign(url.href); return; }
      this.config = action === 'disconnect' ? await this.api.disconnect() : await this.api.internal(); this.settings = false; this.notice = 'Fonte da agenda atualizada.'; await this.load();
    } catch (error) { this.modalError = this.message(error); } finally { this.saving = false; }
  }
  message(error: unknown): string {
    const e = error as { status?: number; message?: string; error?: { message?: string } };
    if (e.status === 409) return 'Este horário não está mais disponível. Consulte os horários livres e tente novamente.';
    if (e.status === 0) return 'Não foi possível conectar à API. Verifique a conexão e tente novamente.';
    if (e.status === 401 || e.status === 403) return 'Sua sessão expirou ou você não tem permissão para esta ação.';
    return e.error?.message || (error instanceof Error && !e.status ? e.message! : 'Não foi possível concluir a operação. Tente novamente.');
  }
}
