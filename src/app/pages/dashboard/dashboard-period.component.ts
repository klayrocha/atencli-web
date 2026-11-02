import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import {
  DashboardResultsService,
  ResultsDashboard,
  ResultsHeatCell,
  ResultsKpi,
  ResultsRankItem,
  ResultsSlice
} from './dashboard-results.service';

type PresetKey = '7d' | '30d' | 'month' | 'lastMonth' | '90d' | '12m' | 'custom';

interface KpiView {
  kpi: ResultsKpi;
  value: string;
  delta: { text: string; tone: 'good' | 'bad' | 'neutral'; icon: string } | null;
  sparkline: string | null;
}

interface StatusSegment extends ResultsSlice {
  color: string;
  share: number;
}

/** Chart colors, validated for color-vision deficiency on the white surface (dataviz validator). */
const SERIES = { contacts: '#4d7c0f', scheduled: '#2a78d6' };
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#0ca30c',
  CONFIRMED: '#2a78d6',
  PENDING_CONFIRMATION: '#eda100',
  RESCHEDULED: '#6250d6',
  NO_SHOW: '#d03b3b',
  CANCELLED: '#94a3b8'
};
/** Lime ramp, light to dark: empty cell first, then five magnitude steps. */
const HEAT_RAMP = ['#f1f5f9', '#ecfccb', '#d9f99d', '#a3e635', '#65a30d', '#3f6212'];
const FUNNEL_RAMP = ['#3f6212', '#4d7c0f', '#65a30d', '#84cc16'];
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

@Component({
  selector: 'app-dashboard-period',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule],
  templateUrl: './dashboard-period.component.html',
  styleUrls: ['./dashboard-period.component.scss']
})
export class DashboardPeriodComponent implements OnInit {
  private readonly resultsService = inject(DashboardResultsService);
  private timeZone = '';
  private requestId = 0;

  readonly presets: Array<{ key: PresetKey; label: string }> = [
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: 'month', label: 'Este mês' },
    { key: 'lastMonth', label: 'Mês passado' },
    { key: '90d', label: '90 dias' },
    { key: '12m', label: '12 meses' },
    { key: 'custom', label: 'Personalizado' }
  ];
  readonly weekdays = WEEKDAYS;
  readonly hours = Array.from({ length: 24 }, (_, hour) => hour);
  readonly seriesColors = SERIES;
  readonly heatRamp = HEAT_RAMP;

  preset: PresetKey = 'month';
  fromDate = '';
  toDate = '';
  data: ResultsDashboard | null = null;
  loading = true;
  errorMessage = '';

  kpiViews: KpiView[] = [];
  statusSegments: StatusSegment[] = [];
  statusTotal = 0;
  heatGrid: number[][] = [];
  heatMax = 0;
  hoveredCell: { weekday: number; hour: number } | null = null;
  peakLabel = '';
  timelineData: any = null;
  timelineOptions: any = null;
  showTimelineTable = false;
  appointmentsPage = 0;
  readonly appointmentsPageSize = 10;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async selectPreset(key: PresetKey): Promise<void> {
    this.preset = key;
    if (key === 'custom') return;
    const [from, to] = this.presetRange(key);
    this.fromDate = from;
    this.toDate = to;
    await this.load(from, to);
  }

  async applyCustom(): Promise<void> {
    if (!this.validDate(this.fromDate) || !this.validDate(this.toDate) || this.fromDate > this.toDate) {
      this.errorMessage = 'Informe um período válido, com a data inicial anterior ou igual à final.';
      return;
    }
    await this.load(this.fromDate, this.toDate);
  }

  /** Without dates the backend returns the current month, which also gives us the clinic time zone. */
  private async load(fromDate?: string, toDate?: string): Promise<void> {
    const requestId = ++this.requestId;
    this.loading = true;
    this.errorMessage = '';
    try {
      const from = fromDate ? this.startOfDay(fromDate) : undefined;
      const to = toDate ? this.startOfDay(this.addDays(toDate, 1)) : undefined;
      const data = await this.resultsService.getResults(from, to);
      if (requestId !== this.requestId) return;
      this.timeZone = data.period.timeZone;
      if (!fromDate) {
        this.fromDate = this.localDate(new Date(data.period.from));
        this.toDate = this.localDate(new Date(new Date(data.period.to).getTime() - 1));
      }
      this.data = data;
      this.build(data);
    } catch (error: any) {
      if (requestId !== this.requestId) return;
      this.data = null;
      this.errorMessage = error?.status === 400 && error?.error?.message
        ? error.error.message
        : 'Não foi possível carregar os resultados. Tente novamente.';
    } finally {
      if (requestId === this.requestId) this.loading = false;
    }
  }

  private build(data: ResultsDashboard): void {
    this.appointmentsPage = 0;
    this.kpiViews = data.kpis.map(kpi => ({
      kpi,
      value: this.formatValue(kpi.value, kpi.unit),
      delta: this.delta(kpi),
      sparkline: this.sparkline(kpi.trend)
    }));

    this.statusTotal = this.sliceTotal(data.appointmentStatus);
    this.statusSegments = data.appointmentStatus.map(slice => ({
      ...slice,
      color: STATUS_COLORS[slice.key] ?? '#94a3b8',
      share: this.statusTotal ? (slice.value / this.statusTotal) * 100 : 0
    }));

    this.buildHeatmap(data.peakHours);
    this.buildTimeline(data);
  }

  // ---------- KPIs ----------

  private delta(kpi: ResultsKpi): KpiView['delta'] {
    if (kpi.value === null || kpi.previousValue === null) return null;
    const diff = kpi.value - kpi.previousValue;
    if (Math.abs(diff) < 1e-9) return { text: 'Sem variação', tone: 'neutral', icon: 'pi-minus' };
    let text: string;
    if (kpi.unit === 'PERCENT') {
      text = `${this.signed(diff, 1)} p.p.`;
    } else if (kpi.unit === 'MINUTES') {
      text = `${this.signed(diff, 1)} min`;
    } else if (kpi.previousValue === 0) {
      text = `+${this.number(kpi.value)}`;
    } else {
      text = `${this.signed((diff / kpi.previousValue) * 100, 1)}%`;
    }
    const improved = kpi.better === 'UP' ? diff > 0 : diff < 0;
    return { text, tone: improved ? 'good' : 'bad', icon: diff > 0 ? 'pi-arrow-up' : 'pi-arrow-down' };
  }

  private sparkline(values: number[]): string | null {
    if (!values || values.length < 2 || values.every(value => value === 0)) return null;
    const max = Math.max(...values);
    const width = 120;
    const height = 32;
    const step = width / (values.length - 1);
    return values
      .map((value, index) => {
        const x = index * step;
        const y = height - 2 - (max ? (value / max) * (height - 4) : 0);
        return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  kpiIcon(key: string): string {
    const icons: Record<string, string> = {
      newContacts: 'pi-users',
      scheduledAppointments: 'pi-calendar-plus',
      conversionRate: 'pi-percentage',
      attendanceRate: 'pi-check-circle',
      patientsWon: 'pi-heart',
      firstResponse: 'pi-stopwatch'
    };
    return icons[key] ?? 'pi-chart-bar';
  }

  // ---------- Timeline ----------

  private buildTimeline(data: ResultsDashboard): void {
    const dense = data.timeline.length > 31;
    const dataset = (label: string, color: string, values: number[], fill: boolean) => ({
      label,
      data: values,
      borderColor: color,
      backgroundColor: fill ? 'rgba(77, 124, 15, 0.08)' : color,
      fill,
      borderWidth: 2,
      cubicInterpolationMode: 'monotone',
      pointRadius: dense ? 0 : 3,
      pointHoverRadius: 5,
      pointBackgroundColor: color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2
    });
    this.timelineData = {
      labels: data.timeline.map(point => this.bucketLabel(point.bucket, data.granularity)),
      datasets: [
        dataset('Novos contatos', SERIES.contacts, data.timeline.map(point => point.newContacts), true),
        dataset('Consultas agendadas', SERIES.scheduled, data.timeline.map(point => point.scheduledAppointments), false)
      ]
    };
    this.timelineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 10,
          cornerRadius: 8,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            title: (items: any[]) => this.bucketTooltip(data.timeline[items[0].dataIndex].bucket, data.granularity)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: '#e2e8f0' },
          ticks: { color: '#64748b', maxRotation: 0, autoSkipPadding: 16, font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          border: { display: false },
          ticks: { color: '#64748b', precision: 0, font: { size: 11 } }
        }
      }
    };
  }

  granularityLabel(): string {
    const labels: Record<string, string> = { DAY: 'por dia', WEEK: 'por semana', MONTH: 'por mês' };
    return this.data ? labels[this.data.granularity] : '';
  }

  timelineTotal(key: 'newContacts' | 'scheduledAppointments'): number {
    return (this.data?.timeline ?? []).reduce((sum, point) => sum + point[key], 0);
  }

  bucketTooltip(bucket: string, granularity: string): string {
    const date = this.parseLocal(bucket);
    if (granularity === 'MONTH') {
      return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
    }
    const label = new Intl.DateTimeFormat('pt-BR', {
      weekday: granularity === 'DAY' ? 'short' : undefined, day: '2-digit', month: 'short', timeZone: 'UTC'
    }).format(date);
    return granularity === 'WEEK' ? `Semana de ${label}` : label;
  }

  private bucketLabel(bucket: string, granularity: string): string {
    const date = this.parseLocal(bucket);
    if (granularity === 'MONTH') {
      return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(date);
    }
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(date);
  }

  // ---------- Funnel ----------

  funnelWidth(value: number): number {
    const start = this.data?.funnel[0]?.value ?? 0;
    if (!start) return 0;
    return Math.max((value / start) * 100, value > 0 ? 2 : 0);
  }

  funnelColor(index: number): string {
    return FUNNEL_RAMP[Math.min(index, FUNNEL_RAMP.length - 1)];
  }

  // ---------- Slices & rankings ----------

  sliceTotal(slices: ResultsSlice[]): number {
    return slices.reduce((sum, slice) => sum + slice.value, 0);
  }

  sliceShare(slices: ResultsSlice[], key: string): number {
    const total = this.sliceTotal(slices);
    const value = slices.find(item => item.key === key)?.value ?? 0;
    return total ? (value / total) * 100 : 0;
  }

  sliceValue(slices: ResultsSlice[], key: string): number {
    return slices.find(item => item.key === key)?.value ?? 0;
  }

  statusAriaLabel(): string {
    return this.statusSegments
      .filter(segment => segment.value)
      .map(segment => `${segment.label}: ${segment.value}`)
      .join(', ');
  }

  rankWidth(item: ResultsRankItem, items: ResultsRankItem[]): number {
    const max = items[0]?.total ?? 0;
    return max ? (item.total / max) * 100 : 0;
  }

  // ---------- Heatmap ----------

  private buildHeatmap(cells: ResultsHeatCell[]): void {
    this.heatGrid = WEEKDAYS.map(() => Array(24).fill(0));
    for (const cell of cells) {
      if (cell.weekday >= 1 && cell.weekday <= 7 && cell.hour >= 0 && cell.hour < 24) {
        this.heatGrid[cell.weekday - 1][cell.hour] = cell.value;
      }
    }
    this.heatMax = Math.max(0, ...cells.map(cell => cell.value));
    const peak = cells.reduce<ResultsHeatCell | null>((best, cell) => (!best || cell.value > best.value ? cell : best), null);
    this.peakLabel = peak && peak.value > 0
      ? `${WEEKDAYS[peak.weekday - 1]}, ${peak.hour}h às ${peak.hour + 1}h · ${this.number(peak.value)} mensagens`
      : '';
    this.hoveredCell = null;
  }

  heatColor(value: number): string {
    if (!value || !this.heatMax) return HEAT_RAMP[0];
    const step = Math.ceil((value / this.heatMax) * (HEAT_RAMP.length - 1));
    return HEAT_RAMP[Math.min(HEAT_RAMP.length - 1, Math.max(1, step))];
  }

  cellLabel(weekday: number, hour: number): string {
    const value = this.heatGrid[weekday]?.[hour] ?? 0;
    return `${WEEKDAYS[weekday]}, ${hour}h às ${hour + 1}h · ${this.number(value)} ${value === 1 ? 'mensagem' : 'mensagens'}`;
  }

  // ---------- Appointments ----------

  get appointmentPageItems(): ResultsDashboard['appointments'] {
    const start = this.appointmentsPage * this.appointmentsPageSize;
    return this.data?.appointments.slice(start, start + this.appointmentsPageSize) ?? [];
  }

  get appointmentPageCount(): number {
    return Math.ceil((this.data?.appointments.length ?? 0) / this.appointmentsPageSize);
  }

  appointmentStatus(status: string): string {
    const labels: Record<string, string> = {
      PENDING_CONFIRMATION: 'Aguardando',
      CONFIRMED: 'Confirmada',
      COMPLETED: 'Realizada',
      NO_SHOW: 'Falta',
      RESCHEDULED: 'Reagendada'
    };
    return labels[status] ?? status;
  }

  statusColor(status: string): string {
    return STATUS_COLORS[status] ?? '#94a3b8';
  }

  appointmentDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: this.timeZone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(new Date(value));
  }

  // ---------- Formatting ----------

  periodLabel(period: { from: string; to: string } | undefined): string {
    if (!period || !this.timeZone) return '';
    const format = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: this.timeZone
    });
    return `${format.format(new Date(period.from))} – ${format.format(new Date(new Date(period.to).getTime() - 1))}`;
  }

  formatValue(value: number | null, unit: string): string {
    if (value === null || value === undefined) return '—';
    if (unit === 'PERCENT') return `${this.number(value, 1)}%`;
    if (unit === 'MINUTES') return this.duration(value);
    return this.number(value);
  }

  duration(minutes: number | null): string {
    if (minutes === null || minutes === undefined) return '—';
    if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} s`;
    if (minutes < 60) return `${this.number(minutes, minutes < 10 ? 1 : 0)} min`;
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  currency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value ?? 0);
  }

  savedTime(): string {
    const minutes = this.data?.aiSavings.estimatedMinutesSaved ?? 0;
    if (minutes < 60) return `${minutes} min`;
    return `${this.number(minutes / 60, 1)} h`;
  }

  number(value: number, digits = 0): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value);
  }

  percent(value: number | null): string {
    return value === null || value === undefined ? '—' : `${this.number(value, 1)}%`;
  }

  private signed(value: number, digits: number): string {
    return `${value > 0 ? '+' : '−'}${this.number(Math.abs(value), digits)}`;
  }

  // ---------- Dates in the clinic time zone ----------

  private presetRange(key: PresetKey): [string, string] {
    const today = this.localDate(new Date());
    const monthStart = `${today.slice(0, 7)}-01`;
    switch (key) {
      case '7d': return [this.addDays(today, -6), today];
      case '30d': return [this.addDays(today, -29), today];
      case '90d': return [this.addDays(today, -89), today];
      case '12m': return [this.addDays(this.addMonths(today, -12), 1), today];
      case 'lastMonth': return [this.addMonths(monthStart, -1), this.addDays(monthStart, -1)];
      default: return [monthStart, today];
    }
  }

  private localDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timeZone || undefined, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  private parseLocal(value: string): Date {
    return new Date(`${value}T12:00:00Z`);
  }

  private addDays(value: string, days: number): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private addMonths(value: string, months: number): string {
    const date = new Date(`${value}T00:00:00Z`);
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + months);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return date.toISOString().slice(0, 10);
  }

  private validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  private startOfDay(value: string): string {
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
