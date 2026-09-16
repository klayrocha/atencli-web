import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import { ClientAvailabilityOption, WizardService } from '../wizard-shared/wizard.service';

export interface DaySchedule {
  key: string;
  label: string;
  shortLabel: string;
  active: boolean;
  start: string;
  end: string;
}

export interface ScheduleException {
  id: number;
  date: string;
  type: 'WORKING_HOURS' | 'CLOSED';
  start: string;
  end: string;
  description: string;
}

export interface ExceptionTypeOption {
  label: string;
  value: 'WORKING_HOURS' | 'CLOSED';
}

@Component({
  selector: 'app-wizard-step-4-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    WizardSummaryComponent,
  ],
  templateUrl: './wizard-step-4-schedule.component.html',
  styleUrls: ['./wizard-step-4-schedule.component.scss'],
})
export class WizardStep4ScheduleComponent implements OnInit {

  loading = signal(true);
  saving = signal(false);
  savedAvailability: ClientAvailabilityOption[] = [];

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(s => ({
    ...s,
    current: s.id === 4,
    completed: s.id <= 3,
  }));

  days: DaySchedule[] = [
    { key: 'mon', label: 'Segunda',  shortLabel: 'Seg', active: true,  start: '08:00', end: '19:00' },
    { key: 'tue', label: 'Terça',    shortLabel: 'Ter', active: true,  start: '08:00', end: '18:00' },
    { key: 'wed', label: 'Quarta',   shortLabel: 'Qua', active: true,  start: '08:00', end: '18:00' },
    { key: 'thu', label: 'Quinta',   shortLabel: 'Qui', active: true,  start: '08:00', end: '18:00' },
    { key: 'fri', label: 'Sexta',    shortLabel: 'Sex', active: true,  start: '08:00', end: '18:00' },
    { key: 'sat', label: 'Sábado',   shortLabel: 'Sáb', active: true,  start: '08:00', end: '18:00' },
    { key: 'sun', label: 'Domingo',  shortLabel: 'Dom', active: true,  start: '08:00', end: '18:00' },
  ];

  exceptionTypeOptions: ExceptionTypeOption[] = [
    { label: 'Horário Especial', value: 'WORKING_HOURS' },
    { label: 'Fechado',          value: 'CLOSED' },
  ];

  exceptions: ScheduleException[] = [];

  newException: Omit<ScheduleException, 'id'> = {
    date: this.todayIso(),
    type: 'CLOSED',
    start: '08:00',
    end: '19:00',
    description: '',
  };

  previewOpen = signal(false);
  showExceptionPanel = signal(true);

  constructor(
    private router: Router,
    private wizardService: WizardService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.savedAvailability = await this.wizardService.getClientAvailability();
      this.restoreSavedAvailability();
    } catch {
      // Mantém os valores padrão quando a API não estiver disponível.
    } finally {
      this.loading.set(false);
    }
  }

  togglePreview(): void {
    this.previewOpen.update(v => !v);
  }

  toggleExceptionPanel(): void {
    this.showExceptionPanel.update(v => !v);
  }

  toggleDay(day: DaySchedule): void {
    day.active = !day.active;
  }

  addException(): void {
    const id = Date.now();
    this.exceptions = [...this.exceptions, { id, ...this.newException }];
    this.newException = {
      date: this.todayIso(),
      type: 'CLOSED',
      start: '08:00',
      end: '19:00',
      description: '',
    };
  }

  removeException(id: number): void {
    this.exceptions = this.exceptions.filter(e => e.id !== id);
  }

  private restoreSavedAvailability(): void {
    if (this.savedAvailability.length === 0) {
      return;
    }

    this.days.forEach(day => day.active = false);
    this.savedAvailability
      .filter(item => item.availabilityType === 'WORKING_HOURS' && item.dayOfWeek !== null)
      .forEach(item => {
        const day = this.days[item.dayOfWeek! - 1];
        if (!day) return;
        day.active = true;
        day.start = this.toTimeInput(item.startTime, day.start);
        day.end = this.toTimeInput(item.endTime, day.end);
      });

    this.exceptions = this.savedAvailability
      .filter(item => item.specificDate && ['NON_WORKING_DAY', 'WORKING_HOURS'].includes(item.availabilityType))
      .map(item => ({
        id: item.id,
        date: item.specificDate!,
        type: item.availabilityType === 'WORKING_HOURS' ? 'WORKING_HOURS' as const : 'CLOSED' as const,
        start: this.toTimeInput(item.startTime, '08:00'),
        end: this.toTimeInput(item.endTime, '19:00'),
        description: item.description ?? '',
      }));
  }

  private toTimeInput(value: string | null, fallback: string): string {
    return value ? value.substring(0, 5) : fallback;
  }

  get activeDaysCount(): number {
    return this.days.filter(d => d.active).length;
  }

  formatDateBr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  isWorkingHour(day: DaySchedule, hour: number): boolean {
    if (!day.active) return false;
    const startH = parseInt(day.start.split(':')[0], 10);
    const endH   = parseInt(day.end.split(':')[0], 10);
    return hour >= startH && hour < endH;
  }

  goBack(): void {
    this.router.navigate(['/wizard-step-3-services']);
  }

  async goNext(): Promise<void> {
    this.saving.set(true);
    try {
      const requests = this.buildAvailabilityRequests();
      for (const request of requests) {
        if (!this.isAlreadySaved(request)) {
          await this.wizardService.createAvailability(request);
        }
      }
      this.router.navigate(['/wizard-step-5-team']);
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  private buildAvailabilityRequests(): Array<{
    availabilityType: 'WORKING_HOURS' | 'NON_WORKING_DAY';
    dayOfWeek?: number;
    specificDate?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
  }> {
    const workingHours = this.days
      .map((day, index) => ({ day, dayOfWeek: index + 1 }))
      .filter(item => item.day.active)
      .map(item => ({
        availabilityType: 'WORKING_HOURS' as const,
        dayOfWeek: item.dayOfWeek,
        startTime: `${item.day.start}:00`,
        endTime: `${item.day.end}:00`,
      }));

    const closedDates = this.exceptions
      .filter(exception => exception.type === 'CLOSED')
      .map(exception => ({
        availabilityType: 'NON_WORKING_DAY' as const,
        specificDate: exception.date,
        description: exception.description || undefined,
      }));

    const specificWorkingHours = this.exceptions
      .filter(exception => exception.type === 'WORKING_HOURS')
      .map(exception => ({
        availabilityType: 'WORKING_HOURS' as const,
        specificDate: exception.date,
        startTime: `${exception.start}:00`,
        endTime: `${exception.end}:00`,
        description: exception.description || undefined,
      }));

    return [...workingHours, ...closedDates, ...specificWorkingHours];
  }

  private isAlreadySaved(request: {
    availabilityType: 'WORKING_HOURS' | 'NON_WORKING_DAY';
    dayOfWeek?: number;
    specificDate?: string;
    startTime?: string;
    endTime?: string;
  }): boolean {
    return this.savedAvailability.some(item =>
      item.availabilityType === request.availabilityType &&
      item.dayOfWeek === (request.dayOfWeek ?? null) &&
      item.specificDate === (request.specificDate ?? null) &&
      this.toTimeInput(item.startTime, '') === (request.startTime?.substring(0, 5) ?? '') &&
      this.toTimeInput(item.endTime, '') === (request.endTime?.substring(0, 5) ?? '')
    );
  }

  activateService(): void {}
}
