import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../auth/auth.service';

export interface DashboardMetricCard {
  key: string;
  label: string;
  value: number | null;
  helper: string | null;
  available: boolean;
  unavailableReason: string | null;
}

export interface DashboardHomeResponse {
  clinic: { uuid: string; name: string | null };
  user: { uuid: string; name: string | null };
  period: { from: string; to: string; timeZone: string };
  status: {
    whatsapp: {
      configured: boolean;
      enabled: boolean;
      connectionStatus: string | null;
      displayPhoneNumber: string | null;
      lastError: string | null;
    };
    ai: {
      configured: boolean;
      enabled: boolean;
      mode: string | null;
    };
  };
  attentionPulse: {
    total: number;
    cards: DashboardMetricCard[];
  };
  actionQueue: Array<{
    type: string;
    title: string;
    description: string;
    actionLabel: string;
    targetType: string;
    targetId: number | null;
    occurredAt: string | null;
  }>;
  todayAppointments: Array<{
    id: number;
    conversationId: number | null;
    contactName: string;
    serviceName: string;
    professionalName: string | null;
    startsAt: string;
    endsAt: string;
    status: string;
  }>;
  journey: DashboardMetricCard[];
  aiToday: {
    assistedNewContacts: number;
    conversationsInAi: number;
    needsReview: number;
    transferredToHuman: number;
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
    helper: string;
  };
  teamToday: Array<{
    userUuid: string;
    userName: string;
    openConversations: number;
    capacity: number | null;
  }>;
  daySummary: {
    conversationsStarted: number;
    confirmedAppointments: number;
    noShows: number;
    cards: DashboardMetricCard[];
  };
  resultsPreview: {
    cards: DashboardMetricCard[];
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardHomeService {
  private readonly CLINIC_NAME_KEY = 'ch_clinic_name';
  private readonly url = `${environment.apiBaseUrl}/api/v1/dashboard/home`;
  readonly clinicName = signal<string | null>(this.loadClinicName());

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get options() {
    return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } };
  }

  async getHome(): Promise<DashboardHomeResponse> {
    const home = await firstValueFrom(this.http.get<DashboardHomeResponse>(this.url, this.options));
    this.clinicName.set(home.clinic.name);
    if (home.clinic.name) {
      sessionStorage.setItem(this.CLINIC_NAME_KEY, home.clinic.name);
    }
    return home;
  }

  private loadClinicName(): string | null {
    return sessionStorage.getItem(this.CLINIC_NAME_KEY);
  }
}
