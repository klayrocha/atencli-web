import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment.development';

export interface ProfessionalHours { dayOfWeek: number; startTime: string; endTime: string; }
export interface ProfessionalTimeOff { startsAt: string; endsAt: string; }
export interface ClinicProfessional {
  uuid: string; fullName: string; active: boolean; serviceIds: number[];
  hours: ProfessionalHours[]; timeOff: ProfessionalTimeOff[];
}
export type ProfessionalRequest = Partial<Omit<ClinicProfessional, 'uuid'>>;

@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/calendar/professionals`;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private get options() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }
  list() { return firstValueFrom(this.http.get<ClinicProfessional[]>(this.url, this.options)); }
  create(data: ProfessionalRequest) { return firstValueFrom(this.http.post<ClinicProfessional>(this.url, data, this.options)); }
  update(uuid: string, data: ProfessionalRequest) { return firstValueFrom(this.http.patch<ClinicProfessional>(`${this.url}/${encodeURIComponent(uuid)}`, data, this.options)); }
}
