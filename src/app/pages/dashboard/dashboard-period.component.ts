import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardHomeResponse, DashboardHomeService, DashboardMetricCard } from './dashboard-home.service';

@Component({
  selector: 'app-dashboard-period',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-period.component.html',
  styleUrls: ['./dashboard-period.component.scss']
})
export class DashboardPeriodComponent implements OnInit {
  private readonly dashboardHome = inject(DashboardHomeService);
  private timeZone = '';
  private requestId = 0;

  fromDate = '';
  toDate = '';
  appliedPeriod = '';
  home: DashboardHomeResponse | null = null;
  loading = true;
  errorMessage = '';
  appointmentsPage = 0;
  readonly appointmentsPageSize = 10;

  get appointmentPageItems(): DashboardHomeResponse['todayAppointments'] {
    const start = this.appointmentsPage * this.appointmentsPageSize;
    return this.home?.todayAppointments.slice(start, start + this.appointmentsPageSize) ?? [];
  }

  get appointmentPageCount(): number {
    return Math.ceil((this.home?.todayAppointments.length ?? 0) / this.appointmentsPageSize);
  }

  async ngOnInit(): Promise<void> {
    try {
      const initial = await this.dashboardHome.getHome();
      this.timeZone = initial.period.timeZone;
      this.toDate = this.dateInClinicTimeZone(new Date());
      this.fromDate = `${this.toDate.slice(0, 7)}-01`;
      await this.loadPeriod();
    } catch {
      this.errorMessage = 'Não foi possível carregar os resultados. Tente novamente.';
      this.loading = false;
    }
  }

  async loadPeriod(): Promise<void> {
    if (!this.timeZone || !this.validDate(this.fromDate) || !this.validDate(this.toDate)
        || this.fromDate > this.toDate) {
      this.errorMessage = 'Informe um período válido, com a data inicial anterior ou igual à final.';
      return;
    }

    const requestId = ++this.requestId;
    const selectedFrom = this.fromDate;
    const selectedTo = this.toDate;
    this.loading = true;
    this.errorMessage = '';
    try {
      const from = this.startOfDayInClinicTimeZone(selectedFrom);
      const to = this.startOfDayInClinicTimeZone(this.nextDate(selectedTo));
      const home = await this.dashboardHome.getHome(from, to);
      if (requestId === this.requestId) {
        this.home = home;
        this.appointmentsPage = 0;
        this.appliedPeriod = `${this.formatDate(selectedFrom)} a ${this.formatDate(selectedTo)}`;
      }
    } catch {
      if (requestId === this.requestId) {
        this.home = null;
        this.errorMessage = 'Não foi possível consultar os resultados. Tente novamente.';
      }
    } finally {
      if (requestId === this.requestId) this.loading = false;
    }
  }

  metricValue(card: DashboardMetricCard): number | string {
    return card.available ? (card.value ?? 0) : '—';
  }

  metricHelper(card: DashboardMetricCard): string {
    return card.available ? (card.helper ?? '') : (card.unavailableReason ?? 'Dados indisponíveis');
  }

  metricIcon(key: string): string {
    const icons: Record<string, string> = {
      newContacts: 'pi-users',
      scheduledAppointments: 'pi-calendar',
      attended: 'pi-check-circle',
      patientsWon: 'pi-heart',
      waitingResponse: 'pi-comments',
      overdueTasks: 'pi-check-square',
      unconfirmedAppointments: 'pi-calendar-clock',
      aiTransfers: 'pi-users',
      unassignedConversations: 'pi-user-plus',
      followUpErrors: 'pi-exclamation-triangle',
      conversationsStarted: 'pi-comments',
      confirmedAppointments: 'pi-calendar',
      noShows: 'pi-user-minus'
    };
    return icons[key] ?? 'pi-chart-bar';
  }

  savingsAmount(): string {
    const savings = this.home?.aiSavings;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: savings?.currency || 'BRL'
    }).format(savings?.estimatedAmount ?? 0);
  }

  savingsTime(): string {
    const minutes = this.home?.aiSavings?.estimatedMinutesSaved ?? 0;
    if (minutes < 60) return `${minutes} min`;
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(minutes / 60)} h`;
  }

  appointmentDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: this.timeZone,
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(value));
  }

  appointmentStatus(status: string): string {
    const labels: Record<string, string> = {
      PENDING_CONFIRMATION: 'Aguardando confirmação',
      CONFIRMED: 'Confirmada',
      COMPLETED: 'Concluída',
      NO_SHOW: 'Falta',
      RESCHEDULED: 'Reagendada'
    };
    return labels[status] ?? status;
  }

  private dateInClinicTimeZone(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  private validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  private nextDate(value: string): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  private startOfDayInClinicTimeZone(value: string): string {
    const midnightUtc = Date.parse(`${value}T00:00:00Z`);
    let offset = this.offsetMinutes(midnightUtc);
    offset = this.offsetMinutes(midnightUtc - offset * 60_000);
    const sign = offset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
    return `${value}T00:00:00${sign}${hours}:${minutes}`;
  }

  private offsetMinutes(timestamp: number): number {
    const name = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timeZone, timeZoneName: 'longOffset'
    }).formatToParts(new Date(timestamp)).find(part => part.type === 'timeZoneName')?.value ?? 'GMT';
    const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(name);
    if (!match) return 0;
    return (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  }
}
