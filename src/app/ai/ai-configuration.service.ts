import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment.development';

export interface AiConfigurationPayload {
  mode: 'ASSISTANT' | 'LIMITED_AUTOMATIC';
  tone: string;
  responseLength: 'SHORT' | 'MEDIUM' | 'DETAILED';
  schedulePolicy: 'FOLLOW_CLINIC_HOURS' | 'CUSTOM_SCHEDULE' | 'ALWAYS';
  serviceStartTime: string | null;
  serviceEndTime: string | null;
  activeDays: number[];
  introductionMessage: string | null;
  outsideHoursMessage: string | null;
  allowedTopics: string[];
  handoffTriggers: string[];
}
export interface AiConfiguration extends AiConfigurationPayload {
  enabled: boolean;
  usingDefaults: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiConfigurationService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/ai/configuration`;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private get options() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }
  getConfiguration() { return firstValueFrom(this.http.get<AiConfiguration>(this.url, this.options)); }
  save(payload: AiConfigurationPayload) { return firstValueFrom(this.http.put<AiConfiguration>(this.url, payload, this.options)); }
  setEnabled(enabled: boolean) { return firstValueFrom(this.http.patch<AiConfiguration>(`${this.url}/status`, { enabled }, this.options)); }
}
