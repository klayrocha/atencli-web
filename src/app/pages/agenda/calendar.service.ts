import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment.development';

export type AppointmentStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'BLOCKED';
export interface CalendarConfiguration { source: 'INTERNAL' | 'GOOGLE'; timeZone: string; googleConnected: boolean; googleCalendarId: string | null; }
export interface CalendarEvent { id: string; appointmentId: number | null; title: string; startsAt: string; endsAt: string; status: AppointmentStatus | null; source: string; professionalName: string | null; managedByAtenclin: boolean; }
export interface Appointment { id: number; conversationId: number | null; serviceId: number | null; professionalUserUuid: string | null; contactName: string; contactPhone: string | null; contactEmail: string | null; serviceName: string; professionalName: string | null; startsAt: string; endsAt: string; status: AppointmentStatus; notes: string | null; }
export interface Slot { startsAt: string; endsAt: string; }
export interface CreateAppointment { serviceId?: number; professionalUserUuid?: string; contactName: string; contactPhone?: string; contactEmail?: string; serviceName?: string; startsAt: string; endsAt?: string; status: AppointmentStatus; notes?: string; }
@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/calendar`;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private get options() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }
  private query(values: Record<string, string | number | undefined>) {
    let params = new HttpParams();
    Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params = params.set(key, value); });
    return { ...this.options, params };
  }
  configuration() { return firstValueFrom(this.http.get<CalendarConfiguration>(`${this.url}/configuration`, this.options)); }
  events(from: string, to: string, professionalUserUuid: string) { return firstValueFrom(this.http.get<CalendarEvent[]>(`${this.url}/events`, this.query({ from, to, professionalUserUuid }))); }
  appointments(from: string, to: string, professionalUserUuid: string) { return firstValueFrom(this.http.get<Appointment[]>(`${this.url}/appointments`, this.query({ from, to, professionalUserUuid }))); }
  slots(from: string, to: string, serviceId: number, professionalUserUuid: string) { return firstValueFrom(this.http.get<Slot[]>(`${this.url}/slots`, this.query({ from, to, serviceId, professionalUserUuid }))); }
  create(payload: CreateAppointment) { return firstValueFrom(this.http.post<Appointment>(`${this.url}/appointments`, payload, this.options)); }
  reschedule(id: number, startsAt: string, endsAt: string) { return firstValueFrom(this.http.patch<Appointment>(`${this.url}/appointments/${id}/schedule`, { startsAt, endsAt }, this.options)); }
  status(id: number, status: AppointmentStatus) { return firstValueFrom(this.http.patch<Appointment>(`${this.url}/appointments/${id}/status`, { status }, this.options)); }
  connect() { return firstValueFrom(this.http.post<{ authorizationUrl: string }>(`${this.url}/google/connect`, {}, this.options)); }
  disconnect() { return firstValueFrom(this.http.delete<CalendarConfiguration>(`${this.url}/google/connection`, this.options)); }
  internal() { return firstValueFrom(this.http.put<CalendarConfiguration>(`${this.url}/configuration`, { source: 'INTERNAL' }, this.options)); }
}
