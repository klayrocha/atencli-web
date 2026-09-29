import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../auth/auth.service';

export type ConversationHandlerType = 'AI' | 'HUMAN' | 'WAITING_HUMAN' | 'CLOSED';
export type ConversationResponsibilityStatus = 'ASSIGNED' | 'UNASSIGNED' | 'TRANSFERRED' | 'CLOSED';

export interface ApiPage<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

export interface AttendanceStage {
  id: number;
  systemCode: string;
  name: string;
  displayOrder: number;
  active: boolean;
  required: boolean;
}

export interface UpdateAttendanceStagePayload {
  name: string;
  displayOrder: number;
  active: boolean;
  replacementStageId: number | null;
}

export interface ConversationSummary {
  id: number;
  profileName: string | null;
  stage: string | null;
  updatedAt: string | null;
  lastMessageText: string | null;
}

export interface ConversationFilters {
  page?: number;
  size?: number;
  stageId?: number | null;
  handlerType?: string;
  responsibilityStatus?: string;
  mine?: boolean;
}

export interface ConversationAssignee {
  userUuid: string;
  fullName: string;
}

export interface ConversationStageHistory {
  id: number;
  previousStage: AttendanceStage | null;
  stage: AttendanceStage;
  actor: ConversationAssignee | null;
  reason: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class EtapasService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/whatsapp`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get options() {
    return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } };
  }

  listStages(): Promise<AttendanceStage[]> {
    return firstValueFrom(this.http.get<AttendanceStage[]>(`${this.url}/attendance-stages`, this.options));
  }

  updateStage(stageId: number, payload: UpdateAttendanceStagePayload): Promise<AttendanceStage> {
    return firstValueFrom(this.http.patch<AttendanceStage>(`${this.url}/attendance-stages/${stageId}`, payload, this.options));
  }

  listConversations(filters: ConversationFilters): Promise<ApiPage<ConversationSummary>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.stageId) params = params.set('stageId', filters.stageId);
    if (filters.handlerType) params = params.set('handlerType', filters.handlerType);
    if (filters.responsibilityStatus) params = params.set('responsibilityStatus', filters.responsibilityStatus);
    if (filters.mine) params = params.set('mine', true);
    return firstValueFrom(this.http.get<ApiPage<ConversationSummary>>(`${this.url}/conversations`, { ...this.options, params }));
  }

  moveConversation(conversationId: number, stageId: number, reason: string | null): Promise<AttendanceStage> {
    return firstValueFrom(this.http.patch<AttendanceStage>(
      `${this.url}/conversations/${conversationId}/stage`,
      { stageId, reason: reason?.trim() || null },
      this.options
    ));
  }

  stageHistory(conversationId: number): Promise<ConversationStageHistory[]> {
    return firstValueFrom(this.http.get<ConversationStageHistory[]>(
      `${this.url}/conversations/${conversationId}/stage-history`,
      this.options
    ));
  }
}
