import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

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
export class WizardStep4ScheduleComponent {

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
    { label: 'Horário Especial (WORKING_HOURS)', value: 'WORKING_HOURS' },
    { label: 'Fechado (CLOSED)',                 value: 'CLOSED' },
  ];

  exceptions: ScheduleException[] = [
    { id: 1, date: '2023-02-01', type: 'CLOSED', start: '08:00', end: '19:00', description: '' },
  ];

  newException: Omit<ScheduleException, 'id'> = {
    date: this.todayIso(),
    type: 'CLOSED',
    start: '08:00',
    end: '19:00',
    description: '',
  };

  previewOpen = signal(false);
  showExceptionPanel = signal(true);

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

  get activeDaysCount(): number {
    return this.days.filter(d => d.active).length;
  }

  get apiPayloadPreview(): string {
    const activeDays = this.days
      .filter(d => d.active)
      .map(d => ({
        dayOfWeek: d.key.toUpperCase(),
        type: 'WORKING_HOURS',
        start: d.start,
        end: d.end,
      }));
    return JSON.stringify(
      {
        userPraxisUuid: 0,
        WORKING_HOURS: activeDays[0] ?? {},
      },
      null,
      2,
    );
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

  // ─── Navegação ─────────────────────────────────────────────────────────────
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/wizard-step-3-services']);
  }

  goNext(): void {
    this.router.navigate(['/wizard-step-5-team']);
  }

  activateService(): void {}
}
