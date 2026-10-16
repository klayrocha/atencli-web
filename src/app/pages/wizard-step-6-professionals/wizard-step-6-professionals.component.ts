import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CalendarService } from '../agenda/calendar.service';
import { clinicInstant, zonedParts } from '../agenda/calendar-date';
import { ClinicProfessional, ProfessionalHours, ProfessionalsService } from '../agenda/professionals.service';
import { WizardService, ClientProvidedServiceOption } from '../wizard-shared/wizard.service';
import { WizardStepperComponent } from '../wizard-shared/wizard-stepper.component';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import { WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';

@Component({
  selector: 'app-wizard-step-6-professionals', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WizardStepperComponent, WizardSummaryComponent],
  templateUrl: './wizard-step-6-professionals.component.html',
  styleUrls: ['./wizard-step-6-professionals.component.scss'],
})
export class WizardStep6ProfessionalsComponent implements OnInit {
  readonly steps = WIZARD_STEPS_DEFAULT;
  readonly days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  professionals: ClinicProfessional[] = [];
  services: ClientProvidedServiceOption[] = [];
  zone = 'America/Sao_Paulo';
  loading = true;
  saving = false;
  loaded = false;
  error = '';
  notice = '';
  editing = false;
  editingUuid: string | null = null;
  fullName = '';
  active = true;
  serviceIds: number[] = [];
  inheritHours = true;
  hours: ProfessionalHours[] = [];
  timeOff: { startsAt: string; endsAt: string }[] = [];

  constructor(private api: ProfessionalsService, private wizard: WizardService,
              private calendar: CalendarService, private router: Router) {}
  ngOnInit() { void this.load(); }
  async load() {
    this.loading = true; this.loaded = false; this.error = '';
    try {
      const [professionals, services, config] = await Promise.all([
        this.api.list(), this.wizard.getClientServices(), this.calendar.configuration(),
      ]);
      this.professionals = professionals; this.services = services.services; this.zone = config.timeZone;
      this.loaded = true;
    } catch { this.error = 'Não foi possível carregar os profissionais. Tente novamente.'; }
    finally { this.loading = false; }
  }
  edit(item?: ClinicProfessional) {
    this.editingUuid = item?.uuid ?? null;
    this.fullName = item?.fullName ?? ''; this.active = item?.active ?? true;
    this.serviceIds = [...(item?.serviceIds ?? [])];
    this.hours = (item?.hours ?? []).map(hour => ({ ...hour, startTime: hour.startTime.slice(0, 5), endTime: hour.endTime.slice(0, 5) }));
    this.inheritHours = !this.hours.length;
    this.timeOff = (item?.timeOff ?? []).map(period => ({ startsAt: zonedParts(period.startsAt, this.zone), endsAt: zonedParts(period.endsAt, this.zone) }));
    this.error = ''; this.notice = ''; this.editing = true;
  }
  toggleService(id: number, checked: boolean) {
    this.serviceIds = checked ? [...new Set([...this.serviceIds, id])] : this.serviceIds.filter(value => value !== id);
  }
  serviceNames(item: ClinicProfessional) {
    return this.services.filter(service => item.serviceIds.includes(service.id)).map(service => service.name).join(', ') || 'Nenhum serviço vinculado';
  }
  addHours() { this.hours.push({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }); }
  cancel() { this.editing = false; this.error = ''; }
  async save() {
    if (this.saving) return;
    this.error = '';
    if (!this.fullName.trim()) { this.error = 'Informe o nome do profissional.'; return; }
    const hours = this.inheritHours ? [] : this.hours;
    if (!this.inheritHours && !hours.length) { this.error = 'Adicione ao menos um horário ou escolha seguir o expediente da clínica.'; return; }
    if (hours.some(hour => !hour.startTime || !hour.endTime || hour.startTime >= hour.endTime)) {
      this.error = 'O início de cada horário deve ser anterior ao fim.'; return;
    }
    if (hours.some((a, index) => hours.slice(index + 1).some(b => a.dayOfWeek === b.dayOfWeek && a.startTime < b.endTime && a.endTime > b.startTime))) {
      this.error = 'Os horários do mesmo dia não podem se sobrepor.'; return;
    }
    this.saving = true;
    try {
      const timeOff = this.timeOff.map(period => ({ startsAt: clinicInstant(period.startsAt, this.zone), endsAt: clinicInstant(period.endsAt, this.zone) }));
      if (timeOff.some(period => Date.parse(period.startsAt) >= Date.parse(period.endsAt))) throw new Error('O fim do afastamento deve ser posterior ao início.');
      const data = { fullName: this.fullName.trim(), active: this.active,
        serviceIds: this.serviceIds.filter(id => this.services.some(service => service.id === id)),
        hours, timeOff };
      const saved = this.editingUuid ? await this.api.update(this.editingUuid, data) : await this.api.create(data);
      this.professionals = [...this.professionals.filter(item => item.uuid !== saved.uuid), saved]
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
      this.editing = false; this.notice = 'Profissional salvo.';
    } catch (error) { this.error = this.message(error); }
    finally { this.saving = false; }
  }
  async toggleActive(item: ClinicProfessional) {
    if (this.saving) return;
    this.saving = true; this.error = ''; this.notice = '';
    try {
      const saved = await this.api.update(item.uuid, { active: !item.active });
      this.professionals = this.professionals.map(row => row.uuid === saved.uuid ? saved : row);
      this.notice = saved.active ? 'Profissional ativado.' : 'Profissional desativado. As consultas já marcadas foram preservadas.';
    } catch (error) { this.error = this.message(error); }
    finally { this.saving = false; }
  }
  next() { if (this.loaded && !this.editing && !this.saving) void this.router.navigate(['/wizard-step-6-whatsapp']); }
  private message(error: unknown) {
    const value = error as { status?: number; error?: { message?: string } };
    if (value.status === 401 || value.status === 403) return 'Sua sessão expirou ou você não tem permissão para esta ação.';
    if (error instanceof Error && !value.status && value.status !== 0) return error.message;
    return 'Não foi possível salvar. Confira os dados e tente novamente.';
  }
}
