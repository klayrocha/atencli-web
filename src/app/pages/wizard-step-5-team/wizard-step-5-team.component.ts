import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import { AuthService } from '../../auth/auth.service';
import {
  AuthProvider,
  InvitationResponse,
  TeamMemberResponse,
  TeamRole,
  TeamUserStatus,
  WizardService,
} from '../wizard-shared/wizard.service';

export type MemberStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'INVITATION_PENDING'
  | 'EXPIRY60H_EXPIRED'
  | 'CANCATION_CANCELLED';

export type MemberProfile =
  | 'Administrador'
  | 'Gestor'
  | 'Atendente/Recepcionista'
  | 'Dentista'
  | 'Auxiliar';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  avatarColor: string;
  statuses: MemberStatus[];
  profile: MemberProfile;
  role: TeamRole;
  owner: boolean;
  editing: boolean;
}

export interface PendingInvite {
  id: string;
  email: string;
  profile: MemberProfile;
  sentAt: string;
  status: 'INVITATION_PENDING' | 'EXPIRY60H_EXPIRED' | 'CANCATION_CANCELLED';
  role: TeamRole;
  authProvider: AuthProvider;
}

@Component({
  selector: 'app-wizard-step-5-team',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, WizardSummaryComponent],
  templateUrl: './wizard-step-5-team.component.html',
  styleUrls: ['./wizard-step-5-team.component.scss'],
})
export class WizardStep5TeamComponent implements OnInit {

  loading = signal(true);
  saving = signal(false);

  steps: WizardStep[] = WIZARD_STEPS_DEFAULT.map(s => ({
    ...s,
    current: s.id === 5,
    completed: s.id <= 4,
  }));

  profileOptions: MemberProfile[] = [
    'Administrador',
    'Gestor',
    'Dentista',
    'Atendente/Recepcionista',
    'Auxiliar',
  ];

  members: TeamMember[] = [];
  pendingInvites: PendingInvite[] = [];

  // Painel "Convidar"
  showInviteForm = signal(false);
  inviteFullName = '';
  inviteEmail    = '';
  inviteProfile: MemberProfile = 'Atendente/Recepcionista';
  inviteAuthProvider: AuthProvider = 'LOCAL';

  // Accordion convites pendentes
  pendingOpen = signal(false);

  // Edição inline
  editBuffer: Partial<TeamMember> = {};

  togglePendingOpen(): void {
    this.pendingOpen.update(v => !v);
  }

  toggleInviteForm(): void {
    this.showInviteForm.update(v => !v);
    this.inviteFullName = '';
    this.inviteEmail   = '';
    this.inviteProfile = 'Atendente/Recepcionista';
    this.inviteAuthProvider = 'LOCAL';
  }

  async sendInvite(): Promise<void> {
    if (!this.inviteFullName.trim() || !this.inviteEmail.trim()) return;
    this.saving.set(true);
    try {
      await this.wizardService.inviteMember({
        fullName: this.inviteFullName.trim(),
        email: this.inviteEmail.trim(),
        role: this.roleFromProfile(this.inviteProfile),
        authProvider: this.inviteAuthProvider,
        canReceiveConversations: false,
        sendInvitationNow: true,
      });
      await this.loadTeam();
      this.showInviteForm.set(false);
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(member: TeamMember): void {
    if (this.isProtectedAdministrator(member)) return;
    this.members.forEach(m => (m.editing = false));
    this.editBuffer = { name: member.name, email: member.email, profile: member.profile };
    member.editing = true;
  }

  async saveEdit(member: TeamMember): Promise<void> {
    if (this.isProtectedAdministrator(member)) return;
    if (!this.editBuffer.profile) return;
    this.saving.set(true);
    try {
      await this.wizardService.updateTeamMember(member.id, {
        role: this.roleFromProfile(this.editBuffer.profile as MemberProfile),
      });
      await this.loadTeam();
      this.editBuffer = {};
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  async transferOwnership(member: TeamMember): Promise<void> {
    if (this.isProtectedAdministrator(member)) return;
    const reason = window.prompt('Informe o motivo da transferência de propriedade:');
    if (!reason?.trim()) return;

    this.saving.set(true);
    try {
      await this.wizardService.transferOwnership(member.id, reason.trim());
      await this.loadTeam();
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  cancelEdit(member: TeamMember): void {
    member.editing = false;
    this.editBuffer = {};
  }

  async removeMember(id: string): Promise<void> {
    const member = this.members.find(item => item.id === id);
    if (member && this.isProtectedAdministrator(member)) return;
    this.saving.set(true);
    try {
      await this.wizardService.updateTeamMember(id, {
        status: 'DISABLED',
        reason: 'Membro desativado pela gestão da clínica',
      });
      await this.loadTeam();
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  async resendInvite(invite: PendingInvite): Promise<void> {
    this.saving.set(true);
    try {
      await this.wizardService.resendInvitation(invite.id);
      await this.loadTeam();
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  async cancelInvite(id: string): Promise<void> {
    this.saving.set(true);
    try {
      await this.wizardService.cancelInvitation(id, 'Convite cancelado pela gestão da clínica');
      await this.loadTeam();
    } catch {
      // Erro silenciado — pode adicionar toast aqui no futuro
    } finally {
      this.saving.set(false);
    }
  }

  get activeCount(): number   { return this.members.filter(m => m.statuses.includes('ACTIVE')).length; }
  get pendingCount(): number  { return this.pendingInvites.filter(i => i.status === 'INVITATION_PENDING').length; }

  formatDateBr(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  statusLabel(s: MemberStatus): string {
    const map: Record<MemberStatus, string> = {
      ACTIVE:               'Ativo',
      INACTIVE:             'Inativo',
      INVITATION_PENDING:   'INVITATION_PENDING',
      EXPIRY60H_EXPIRED:    'Expiry60H_EXPIRED',
      CANCATION_CANCELLED:  'CANCATION_CANCELLED',
    };
    return map[s];
  }

  isProtectedAdministrator(member: TeamMember): boolean {
    const loggedEmail = this.authService.currentProfile()?.email?.trim().toLowerCase();
    return member.role === 'ADMIN'
      && !!loggedEmail
      && member.email.trim().toLowerCase() === loggedEmail;
  }

  private async loadTeam(): Promise<void> {
    try {
      const response = await this.wizardService.getTeam();
      this.members = response.members.map(member => this.mapMember(member));
      this.pendingInvites = response.invitations.map(invitation => this.mapInvitation(invitation));
    } catch {
      // Mantém a tela vazia quando a API não estiver disponível.
    } finally {
      this.loading.set(false);
    }
  }

  private mapMember(member: TeamMemberResponse): TeamMember {
    return {
      id: member.userUuid,
      name: member.fullName,
      email: member.email,
      initials: this.initials(member.fullName),
      avatarColor: this.avatarColor(member.userUuid),
      statuses: [this.memberStatus(member.status)],
      profile: this.profileFromRole(member.role),
      role: member.role,
      owner: member.owner,
      editing: false,
    };
  }

  private mapInvitation(invitation: InvitationResponse): PendingInvite {
    return {
      id: invitation.uuid,
      email: invitation.email,
      profile: this.profileFromRole(invitation.role),
      sentAt: invitation.createdAt?.split('T')[0] ?? '',
      status: this.invitationStatus(invitation.status),
      role: invitation.role,
      authProvider: invitation.authProvider,
    };
  }

  private roleFromProfile(profile: MemberProfile): TeamRole {
    return profile === 'Administrador' ? 'ADMIN' : profile === 'Gestor' ? 'MANAGER' : 'ATTENDANT';
  }

  private profileFromRole(role: TeamRole): MemberProfile {
    return role === 'ADMIN' ? 'Administrador' : role === 'MANAGER' ? 'Gestor' : 'Atendente/Recepcionista';
  }

  private memberStatus(status: TeamUserStatus): MemberStatus {
    return status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
  }

  private invitationStatus(status: InvitationResponse['status']): PendingInvite['status'] {
    return status === 'PENDING' ? 'INVITATION_PENDING' : status === 'EXPIRED' ? 'EXPIRY60H_EXPIRED' : 'CANCATION_CANCELLED';
  }

  private initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
  }

  private avatarColor(id: string): string {
    const colors = ['#84cc16', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];
    const index = [...id].reduce((total, char) => total + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  constructor(
    private router: Router,
    private wizardService: WizardService,
    private authService: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTeam();
  }

  goBack():  void { this.router.navigate(['/wizard-step-4-schedule']); }
  goNext():  void { this.router.navigate(['/wizard-step-6-whatsapp']); }
  activateService(): void {}
}
