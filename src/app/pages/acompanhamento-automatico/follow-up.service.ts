import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../auth/auth.service';

export type FollowUpTemplateCode =
  | 'INFORMATION_REQUEST_STOPPED'
  | 'INTEREST_WITHOUT_APPOINTMENT'
  | 'APPOINTMENT_CONFIRMATION'
  | 'APPOINTMENT_REMINDER_ONE_DAY_BEFORE'
  | 'NO_SHOW'
  | 'RETURN_REQUESTED'
  | 'STAGE_PATIENT_WON';

export type FollowUpExecutionStatus = 'SCHEDULED' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type FollowUpFinishedReason =
  | 'CONTACT_REPLIED'
  | 'APPOINTMENT_SCHEDULED'
  | 'APPOINTMENT_CONFIRMED'
  | 'PATIENT_WON'
  | 'LOST'
  | 'HUMAN_PAUSED'
  | 'INCOMPATIBLE_STAGE'
  | 'ATTEMPT_LIMIT_REACHED'
  | 'TEMPLATE_DISABLED'
  | 'MANUAL_CANCELLED'
  | 'CHANNEL_WINDOW_EXPIRED'
  | 'PERMANENT_ERROR';

export interface FollowUpTemplate {
  id: number;
  code: FollowUpTemplateCode;
  name: string;
  enabled: boolean;
  firstDelayMinutes: number;
  maxMessages: number;
  intervalMinutes: number;
  allowedStartTime: string | null;
  allowedEndTime: string | null;
  activeDays: number[];
  messageOne: string;
  messageTwo: string | null;
  messageThree: string | null;
  whatsappTemplateName: string | null;
  whatsappTemplateLanguage: string;
  whatsappTemplateBodyParameters: string[];
  responsibleUserUuid: string | null;
  responsibleUserName: string | null;
  createTaskOnFinish: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpTemplatePayload {
  enabled: boolean;
  firstDelayMinutes: number;
  maxMessages: number;
  intervalMinutes: number;
  allowedStartTime: string | null;
  allowedEndTime: string | null;
  activeDays: number[];
  messageOne: string;
  messageTwo: string | null;
  messageThree: string | null;
  whatsappTemplateName: string | null;
  whatsappTemplateLanguage: string;
  whatsappTemplateBodyParameters: string[];
  responsibleUserUuid: string | null;
  createTaskOnFinish: boolean;
}

export interface FollowUpExecution {
  id: number;
  conversationId: number;
  contactName: string | null;
  contactPhone: string | null;
  currentStage: string | null;
  assigneeUserUuid: string | null;
  assigneeUserName: string | null;
  templateCode: FollowUpTemplateCode;
  templateName: string;
  status: FollowUpExecutionStatus;
  nextAttemptAt: string | null;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt: string | null;
  finishedAt: string | null;
  finishedReason: FollowUpFinishedReason | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpExecutionFilters {
  status?: string;
  templateCode?: string;
  conversationId?: number | null;
  assigneeUserUuid?: string;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class FollowUpService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/follow-up`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get options() {
    return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } };
  }

  listTemplates(): Promise<FollowUpTemplate[]> {
    return firstValueFrom(this.http.get<FollowUpTemplate[]>(`${this.url}/templates`, this.options));
  }

  updateTemplate(code: FollowUpTemplateCode, payload: FollowUpTemplatePayload): Promise<FollowUpTemplate> {
    return firstValueFrom(this.http.put<FollowUpTemplate>(`${this.url}/templates/${code}`, payload, this.options));
  }

  setTemplateStatus(code: FollowUpTemplateCode, enabled: boolean): Promise<FollowUpTemplate> {
    return firstValueFrom(this.http.patch<FollowUpTemplate>(`${this.url}/templates/${code}/status`, { enabled }, this.options));
  }

  listExecutions(filters: FollowUpExecutionFilters = {}): Promise<FollowUpExecution[]> {
    let params = new HttpParams().set('size', filters.size ?? 50);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.templateCode) params = params.set('templateCode', filters.templateCode);
    if (filters.conversationId) params = params.set('conversationId', filters.conversationId);
    if (filters.assigneeUserUuid?.trim()) params = params.set('assigneeUserUuid', filters.assigneeUserUuid.trim());
    return firstValueFrom(this.http.get<FollowUpExecution[]>(`${this.url}/executions`, { ...this.options, params }));
  }

  pauseExecution(id: number): Promise<FollowUpExecution> {
    return firstValueFrom(this.http.post<FollowUpExecution>(`${this.url}/executions/${id}/pause`, {}, this.options));
  }

  resumeExecution(id: number): Promise<FollowUpExecution> {
    return firstValueFrom(this.http.post<FollowUpExecution>(`${this.url}/executions/${id}/resume`, {}, this.options));
  }

  cancelExecution(id: number): Promise<FollowUpExecution> {
    return firstValueFrom(this.http.post<FollowUpExecution>(`${this.url}/executions/${id}/cancel`, {}, this.options));
  }
}
