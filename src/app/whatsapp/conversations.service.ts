import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment.development';

export type ConversationFilter = 'all' | 'mine' | 'unassigned';
export interface ApiPage<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}
export interface ConversationSummary {
  id: number;
  profileName: string | null;
  stage: string | null;
  updatedAt: string | null;
  lastMessageText: string | null;
}
export interface ConversationDetail {
  id: number;
  profileName: string | null;
  name: string | null;
  email: string | null;
  birthDate: string | null;
  phone: string | null;
  city: string | null;
  profession: string | null;
  preferredContactTime: string | null;
  interestTags: string[];
  origin: string | null;
  stage: string | null;
  assignee: { userUuid: string; fullName: string } | null;
}
export interface ConversationMessage {
  id: number;
  metaMessageId: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  source: 'CLOUD_API' | 'BUSINESS_APP' | 'HISTORY';
  messageType: string;
  textBody: string | null;
  status: string;
  errorText: string | null;
  metaTimestamp: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConversationsService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/whatsapp`;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private get headers() { return { Authorization: `Bearer ${this.auth.getToken()}` }; }

  list(filter: ConversationFilter, page = 0): Promise<ApiPage<ConversationSummary>> {
    let params = new HttpParams().set('page', page).set('size', 50);
    if (filter === 'mine') params = params.set('mine', true);
    if (filter === 'unassigned') params = params.set('responsibilityStatus', 'UNASSIGNED');
    return firstValueFrom(this.http.get<ApiPage<ConversationSummary>>(`${this.url}/conversations`, { headers: this.headers, params }));
  }
  detail(id: number): Promise<ConversationDetail> {
    return firstValueFrom(this.http.get<ConversationDetail>(`${this.url}/conversations/${id}`, { headers: this.headers }));
  }
  messages(id: number, page = 0): Promise<ApiPage<ConversationMessage>> {
    return firstValueFrom(this.http.get<ApiPage<ConversationMessage>>(`${this.url}/conversations/${id}/messages`, {
      headers: this.headers, params: new HttpParams().set('page', page).set('size', 100),
    }));
  }
  send(to: string, text: string): Promise<ConversationMessage> {
    return firstValueFrom(this.http.post<ConversationMessage>(`${this.url}/messages`, { to, text }, { headers: this.headers }));
  }
}
