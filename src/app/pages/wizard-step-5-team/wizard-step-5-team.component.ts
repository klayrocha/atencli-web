import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { WizardStep, WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

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
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  avatarColor: string;
  statuses: MemberStatus[];
  profile: MemberProfile;
  editing: boolean;
}

export interface PendingInvite {
  id: number;
  email: string;
  profile: MemberProfile;
  sentAt: string;
  status: 'INVITATION_PENDING' | 'EXPIRY60H_EXPIRED' | 'CANCATION_CANCELLED';
}

@Component({
  selector: 'app-wizard-step-5-team',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, WizardSummaryComponent],
  templateUrl: './wizard-step-5-team.component.html',
  styleUrls: ['./wizard-step-5-team.component.scss'],
})
export class WizardStep5TeamComponent {

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

  members: TeamMember[] = [
    {
      id: 1,
      name: 'Ana Souza',
      email: 'ana@clinica.com',
      initials: 'AS',
      avatarColor: '#84cc16',
      statuses: ['ACTIVE'],
      profile: 'Administrador',
      editing: false,
    },
    {
      id: 2,
      name: 'João Silva',
      email: 'joao@gmail.com',
      initials: 'JS',
      avatarColor: '#6366f1',
      statuses: ['INACTIVE'],
      profile: 'Gestor',
      editing: false,
    },
    {
      id: 3,
      name: 'Maria Pereira',
      email: 'maria@gmail.com',
      initials: 'MP',
      avatarColor: '#f59e0b',
      statuses: ['INVITATION_PENDING', 'EXPIRY60H_EXPIRED', 'CANCATION_CANCELLED'],
      profile: 'Atendente/Recepcionista',
      editing: false,
    },
  ];

  pendingInvites: PendingInvite[] = [
    { id: 1, email: 'carlos@clinica.com',   profile: 'Dentista',               sentAt: '2025-07-01', status: 'INVITATION_PENDING'   },
    { id: 2, email: 'fernanda@gmail.com',   profile: 'Atendente/Recepcionista', sentAt: '2025-06-28', status: 'EXPIRY60H_EXPIRED'    },
    { id: 3, email: 'roberto@empresa.com',  profile: 'Auxiliar',               sentAt: '2025-06-20', status: 'CANCATION_CANCELLED'  },
  ];

  // Painel "Convidar"
  showInviteForm = signal(false);
  inviteEmail    = '';
  inviteProfile: MemberProfile = 'Atendente/Recepcionista';

  // Accordion convites pendentes
  pendingOpen = signal(false);

  // Edição inline
  editBuffer: Partial<TeamMember> = {};

  togglePendingOpen(): void {
    this.pendingOpen.update(v => !v);
  }

  toggleInviteForm(): void {
    this.showInviteForm.update(v => !v);
    this.inviteEmail   = '';
    this.inviteProfile = 'Atendente/Recepcionista';
  }

  sendInvite(): void {
    if (!this.inviteEmail.trim()) return;
    const newInvite: PendingInvite = {
      id: Date.now(),
      email: this.inviteEmail.trim(),
      profile: this.inviteProfile,
      sentAt: new Date().toISOString().split('T')[0],
      status: 'INVITATION_PENDING',
    };
    this.pendingInvites = [newInvite, ...this.pendingInvites];
    this.showInviteForm.set(false);
    this.inviteEmail = '';
  }

  startEdit(member: TeamMember): void {
    this.members.forEach(m => (m.editing = false));
    this.editBuffer = { name: member.name, email: member.email, profile: member.profile };
    member.editing = true;
  }

  saveEdit(member: TeamMember): void {
    if (this.editBuffer.name)    member.name    = this.editBuffer.name;
    if (this.editBuffer.email)   member.email   = this.editBuffer.email;
    if (this.editBuffer.profile) member.profile = this.editBuffer.profile;
    member.editing = false;
    this.editBuffer = {};
  }

  cancelEdit(member: TeamMember): void {
    member.editing = false;
    this.editBuffer = {};
  }

  removeMember(id: number): void {
    this.members = this.members.filter(m => m.id !== id);
  }

  resendInvite(invite: PendingInvite): void {
    invite.status = 'INVITATION_PENDING';
    invite.sentAt = new Date().toISOString().split('T')[0];
  }

  cancelInvite(id: number): void {
    this.pendingInvites = this.pendingInvites.filter(i => i.id !== id);
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

  constructor(private router: Router) {}

  goBack():  void { this.router.navigate(['/wizard-step-4-schedule']); }
  goNext():  void { this.router.navigate(['/wizard-step-6-whatsapp']); }
  activateService(): void {}
}
