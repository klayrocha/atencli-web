import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../auth/auth.service';

export type ResultsGranularity = 'DAY' | 'WEEK' | 'MONTH';
export type ResultsUnit = 'COUNT' | 'PERCENT' | 'MINUTES';

export interface ResultsPeriod {
  from: string;
  to: string;
  timeZone: string;
}

export interface ResultsKpi {
  key: string;
  label: string;
  value: number | null;
  previousValue: number | null;
  unit: ResultsUnit;
  better: 'UP' | 'DOWN';
  helper: string;
  trend: number[];
}

export interface ResultsTimelinePoint {
  bucket: string;
  newContacts: number;
  scheduledAppointments: number;
  completedAppointments: number;
  patientsWon: number;
}

export interface ResultsFunnelStep {
  key: string;
  label: string;
  value: number;
  rateFromPrevious: number | null;
  rateFromStart: number | null;
}

export interface ResultsSlice {
  key: string;
  label: string;
  value: number;
}

export interface ResultsRankItem {
  name: string;
  total: number;
  completed: number;
  noShows: number;
}

export interface ResultsHeatCell {
  weekday: number;
  hour: number;
  value: number;
}

export interface ResultsDashboard {
  clinicName: string | null;
  period: ResultsPeriod;
  previousPeriod: ResultsPeriod;
  granularity: ResultsGranularity;
  kpis: ResultsKpi[];
  timeline: ResultsTimelinePoint[];
  funnel: ResultsFunnelStep[];
  appointmentStatus: ResultsSlice[];
  appointmentOrigin: ResultsSlice[];
  channels: ResultsSlice[];
  topServices: ResultsRankItem[];
  topProfessionals: ResultsRankItem[];
  peakHours: ResultsHeatCell[];
  responseTime: {
    averageMinutes: number | null;
    medianMinutes: number | null;
    within5MinutesRate: number | null;
    sampleSize: number;
  };
  aiSavings: {
    estimatedAmount: number;
    currency: string;
    estimatedMinutesSaved: number;
    assistedContacts: number;
    aiScheduledAppointments: number;
    hourlyCost: number;
    minutesSavedPerAssistedContact: number;
    minutesSavedPerScheduledAppointment: number;
  };
  appointments: Array<{
    id: number;
    contactName: string;
    serviceName: string;
    professionalName: string | null;
    startsAt: string;
    status: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class DashboardResultsService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/dashboard/results`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getResults(from?: string, to?: string): Promise<ResultsDashboard> {
    return firstValueFrom(this.http.get<ResultsDashboard>(this.url, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` },
      params: from && to ? { from, to } : {}
    }));
  }
}
