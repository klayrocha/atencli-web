import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../auth/auth.service';

// ─── Modelos de lista ─────────────────────────────────────────────────────────

export interface StateOption {
  id: string;
  name: string;
}

export interface ClientTypeOption {
  id: string;
  name: string;
}

export interface HealthPlanOption {
  id: number;
  name: string;
}

// ─── Modelo do formulário Passo 1 ─────────────────────────────────────────────

export interface AboutPayload {
  uuid: string;
  clientName: string;
  email: string;
  typeClientId: number;
  description: string;
  cityName: string;
  stateId: number;
  phoneNumber: string;
  acceptsHealthPlan: boolean;
}

export interface AboutResponse {
  uuid: string;
  email: string;
  phoneNumber: string;
  languageCode: string;
  clientName: string;
  typeClientId: number | null;
  description: string;
  cityName: string;
  stateId: number | null;
  acceptsHealthPlan: boolean | null;
}

export interface ClientHealthPlansResponse {
  clientUuid: string;
  acceptsHealthPlan: boolean | null;
  healthPlans: HealthPlanOption[];
}

export interface SpecialtyOption {
  id: number;
  name: string;
}

export interface ClientSpecialtiesResponse {
  clientUuid: string;
  specialties: SpecialtyOption[];
}

export interface ProvidedServiceOption {
  id: string;
  name: string;
  valor: number | null;
}

export interface ClientProvidedServiceOption {
  id: number;
  name: string;
  defaultValue: number | null;
  price: number | null;
  planPrice: number | null;
  durationMinutes: number | null;
}

export interface ClientProvidedServicesResponse {
  clientUuid: string;
  services: ClientProvidedServiceOption[];
}

export type TeamRole = 'ADMIN' | 'MANAGER' | 'ATTENDANT';
export type TeamUserStatus = 'ACTIVE' | 'DISABLED' | 'BLOCKED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface TeamMemberResponse {
  userUuid: string;
  fullName: string;
  email: string;
  role: TeamRole;
  authProvider: AuthProvider;
  status: TeamUserStatus;
  owner: boolean;
  canReceiveConversations: boolean;
  lastActivityAt: string | null;
  assignedConversations: number;
}

export interface InvitationResponse {
  uuid: string;
  fullName: string;
  email: string;
  role: TeamRole;
  authProvider: AuthProvider;
  canReceiveConversations: boolean;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface TeamResponse {
  members: TeamMemberResponse[];
  invitations: InvitationResponse[];
}

export interface InvitationDetailsResponse {
  clientName: string;
  fullName: string;
  maskedEmail: string;
  role: TeamRole;
  authProvider: AuthProvider;
  status: InvitationStatus;
  expiresAt: string;
}

export type AvailabilityType = 'WORKING_HOURS' | 'BREAK' | 'NON_WORKING_DAY';

export interface ClientAvailabilityOption {
  id: number;
  clientUuid: string;
  availabilityType: AvailabilityType;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string | null;
  endTime: string | null;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class WizardService {

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  private get headers() {
    const token = this.auth.getToken();
    return { Authorization: `Bearer ${token}` };
  }

  private get clientUuid(): string {
    return this.auth.currentProfile()?.clientUuid ?? '';
  }

  // ─── Listas ───────────────────────────────────────────────────────────────

  async getStates(): Promise<StateOption[]> {
    return firstValueFrom(
      this.http.get<StateOption[]>(
        `${environment.apiBaseUrl}/api/v1/lists/all-states`,
        { headers: this.headers }
      )
    );
  }

  async getClientTypes(): Promise<ClientTypeOption[]> {
    return firstValueFrom(
      this.http.get<ClientTypeOption[]>(
        `${environment.apiBaseUrl}/api/v1/lists/all-type-clients`,
        { headers: this.headers }
      )
    );
  }

  async getHealthPlans(): Promise<HealthPlanOption[]> {
    return firstValueFrom(
      this.http.get<HealthPlanOption[]>(
        `${environment.apiBaseUrl}/api/v1/lists/health-plans`,
        { headers: this.headers }
      )
    );
  }

  async getAbout(): Promise<AboutResponse> {
    return firstValueFrom(
      this.http.get<AboutResponse>(
        `${environment.apiBaseUrl}/api/v1/about/${this.clientUuid}`,
        { headers: this.headers }
      )
    );
  }

  async getClientHealthPlans(): Promise<ClientHealthPlansResponse> {
    return firstValueFrom(
      this.http.get<ClientHealthPlansResponse>(
        `${environment.apiBaseUrl}/api/v1/client/health-plans`,
        { headers: this.headers }
      )
    );
  }

  async getSpecialtiesByTypeClient(typeClientId: number): Promise<SpecialtyOption[]> {
    return firstValueFrom(
      this.http.get<SpecialtyOption[]>(
        `${environment.apiBaseUrl}/api/v1/lists/type-client/${typeClientId}/specialties`,
        { headers: this.headers }
      )
    );
  }

  async getClientSpecialties(): Promise<ClientSpecialtiesResponse> {
    return firstValueFrom(
      this.http.get<ClientSpecialtiesResponse>(
        `${environment.apiBaseUrl}/api/v1/client/specialties`,
        { headers: this.headers }
      )
    );
  }

  async getServicesByTypeClient(typeClientId: number): Promise<ProvidedServiceOption[]> {
    return firstValueFrom(
      this.http.get<ProvidedServiceOption[]>(
        `${environment.apiBaseUrl}/api/v1/lists/type-client/${typeClientId}/services`,
        { headers: this.headers }
      )
    );
  }

  async getClientServices(): Promise<ClientProvidedServicesResponse> {
    return firstValueFrom(
      this.http.get<ClientProvidedServicesResponse>(
        `${environment.apiBaseUrl}/api/v1/client/services`,
        { headers: this.headers }
      )
    );
  }

  async saveServices(services: Array<{
    serviceId: number;
    price: number;
    planPrice: number;
    durationMinutes: number;
  }>): Promise<void> {
    await firstValueFrom(
      this.http.put(
        `${environment.apiBaseUrl}/api/v1/client/services`,
        { services },
        { headers: this.headers }
      )
    );
  }

  async getClientAvailability(): Promise<ClientAvailabilityOption[]> {
    return firstValueFrom(
      this.http.get<ClientAvailabilityOption[]>(
        `${environment.apiBaseUrl}/api/v1/client/availability`,
        { headers: this.headers }
      )
    );
  }

  async createAvailability(availability: {
    availabilityType: AvailabilityType;
    dayOfWeek?: number;
    specificDate?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
  }): Promise<ClientAvailabilityOption> {
    return firstValueFrom(
      this.http.post<ClientAvailabilityOption>(
        `${environment.apiBaseUrl}/api/v1/client/availability`,
        availability,
        { headers: this.headers }
      )
    );
  }

  async getTeam(): Promise<TeamResponse> {
    return firstValueFrom(
      this.http.get<TeamResponse>(
        `${environment.apiBaseUrl}/api/v1/clients/${this.clientUuid}/team`,
        { headers: this.headers }
      )
    );
  }

  async inviteMember(data: {
    fullName: string;
    email: string;
    role: TeamRole;
    authProvider: AuthProvider;
    canReceiveConversations: boolean;
    sendInvitationNow: boolean;
  }): Promise<InvitationResponse> {
    return firstValueFrom(
      this.http.post<InvitationResponse>(
        `${environment.apiBaseUrl}/api/v1/clients/${this.clientUuid}/invitations`,
        data,
        { headers: this.headers }
      )
    );
  }

  async resendInvitation(invitationUuid: string): Promise<InvitationResponse> {
    return firstValueFrom(
      this.http.post<InvitationResponse>(
        `${environment.apiBaseUrl}/api/v1/clients/${this.clientUuid}/invitations/${invitationUuid}/resend`,
        {},
        { headers: this.headers }
      )
    );
  }

  async cancelInvitation(invitationUuid: string, reason?: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        `${environment.apiBaseUrl}/api/v1/clients/${this.clientUuid}/invitations/${invitationUuid}/cancel`,
        reason ? { reason } : {},
        { headers: this.headers }
      )
    );
  }

  async updateInvitation(invitationUuid: string, data: {
    fullName?: string;
    role?: TeamRole;
    canReceiveConversations?: boolean;
  }): Promise<InvitationResponse> {
    return firstValueFrom(
      this.http.patch<InvitationResponse>(
        `${environment.apiBaseUrl}/api/v1/clients/${this.clientUuid}/invitations/${invitationUuid}`,
        data,
        { headers: this.headers }
      )
    );
  }

  async updateTeamMember(userUuid: string, data: {
    role?: TeamRole;
    status?: TeamUserStatus;
    canReceiveConversations?: boolean;
    reason?: string;
  }): Promise<TeamMemberResponse> {
    return firstValueFrom(
      this.http.patch<TeamMemberResponse>(
        `${environment.apiBaseUrl}/api/v1/clients/${this.clientUuid}/team/${userUuid}`,
        data,
        { headers: this.headers }
      )
    );
  }

  async transferOwnership(newOwnerUserUuid: string, reason: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        `${environment.apiBaseUrl}/api/v1/clients/${this.clientUuid}/ownership-transfer`,
        { newOwnerUserUuid, reason },
        { headers: this.headers }
      )
    );
  }

  async getInvitationDetails(token: string): Promise<InvitationDetailsResponse> {
    return firstValueFrom(
      this.http.get<InvitationDetailsResponse>(
        `${environment.apiBaseUrl}/api/v1/invitations/${token}`
      )
    );
  }

  async acceptLocalInvitation(token: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${environment.apiBaseUrl}/api/v1/invitations/${token}/accept-local`,
        { password }
      )
    );
  }

  startGoogleInvitation(token: string): void {
    window.location.href = `${environment.apiBaseUrl}/api/v1/invitations/${token}/google/start`;
  }

  async saveHealthPlans(healthPlanIds: number[]): Promise<void> {
    await firstValueFrom(
      this.http.put(
        `${environment.apiBaseUrl}/api/v1/client/health-plans`,
        { healthPlanIds },
        { headers: this.headers }
      )
    );
  }

  async saveSpecialties(specialtyIds: number[]): Promise<void> {
    await firstValueFrom(
      this.http.put(
        `${environment.apiBaseUrl}/api/v1/client/specialties`,
        { specialtyIds },
        { headers: this.headers }
      )
    );
  }

  // ─── Passo 1 — About ──────────────────────────────────────────────────────

  async saveAbout(data: Omit<AboutPayload, 'uuid'>): Promise<void> {
    const payload: AboutPayload = { uuid: this.clientUuid, ...data };
    await firstValueFrom(
      this.http.put(
        `${environment.apiBaseUrl}/api/v1/about`,
        payload,
        { headers: this.headers }
      )
    );
  }
}
