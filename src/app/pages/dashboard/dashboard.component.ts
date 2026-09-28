import { OnboardingProgressService } from '../wizard-shared/onboarding-progress.service';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/auth.service';
import { DashboardHomeResponse, DashboardHomeService, DashboardMetricCard } from './dashboard-home.service';

interface Consulta {
  hora: string;
  nome: string;
  especialidade: string;
  status: string;
  iniciais: string;
  cor: string;
}

interface Acao {
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  botao: string;
  icone: string;
  targetType: string;
  targetId: number | null;
}

interface DashboardStat {
  icon: string;
  value: number | string;
  label: string;
  sub: string;
  available: boolean;
}

interface JornadaStep {
  icon: string;
  value: number | string;
  label: string;
  pct: string;
  color: string;
  available: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    ChartModule,
    DividerModule,
    BadgeModule,
    TooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private auth = inject(AuthService);
  private dashboardHome = inject(DashboardHomeService);
  private router = inject(Router);
  readonly onboarding = inject(OnboardingProgressService);

  home: DashboardHomeResponse | null = null;
  loading = true;
  errorMessage = '';

  acoes: Acao[] = [];
  consultas: Consulta[] = [];
  pulsoStats: DashboardStat[] = [];
  jornadaSteps: JornadaStep[] = [];
  daySummaryCards: DashboardMetricCard[] = [];
  resultsCards: DashboardMetricCard[] = [];

  chartData: any;
  chartOptions: any;

  userName(): string {
    const name = this.home?.user?.name ?? this.auth.currentProfile()?.fullName ?? this.auth.currentUser()?.name ?? '';
    return name.split(' ')[0] || 'você';
  }

  ngOnInit() {
    this.initChart(0);
    this.loadDashboard();
  }

  async loadDashboard() {
    this.loading = true;
    this.errorMessage = '';
    try {
      this.home = await this.dashboardHome.getHome();
      this.pulsoStats = this.mapPulseStats(this.home.attentionPulse.cards);
      this.jornadaSteps = this.mapJourney(this.home.journey);
      this.acoes = this.mapActions(this.home.actionQueue);
      this.consultas = this.mapAppointments(this.home.todayAppointments);
      this.daySummaryCards = this.home.daySummary.cards;
      this.resultsCards = this.home.resultsPreview.cards;
      this.initChart(this.home.attentionPulse.total);
    } catch {
      this.errorMessage = 'Não foi possível carregar os dados da página inicial.';
      this.initFallbackData();
    } finally {
      this.loading = false;
    }
  }

  initFallbackData() {
    this.pulsoStats = [];
    this.jornadaSteps = [];
    this.acoes = [];
    this.consultas = [];
    this.daySummaryCards = [];
    this.resultsCards = [];
    this.initChart(0);
  }

  initChart(total: number) {
    const value = Math.max(total, 0);
    const remainder = value > 0 ? Math.max(1, Math.round(value * 0.15)) : 1;
    this.chartData = {
      datasets: [{
        data: [value, remainder],
        backgroundColor: value > 0 ? ['#84cc16', '#e2e8f0'] : ['#e2e8f0', '#e2e8f0'],
        borderWidth: 0,
        hoverOffset: 0,
      }]
    };

    this.chartOptions = {
      cutout: '78%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800
      }
    };
  }

  private mapPulseStats(cards: DashboardMetricCard[]): DashboardStat[] {
    return cards.map(card => ({
      icon: this.iconForMetric(card.key),
      value: this.displayMetricValue(card),
      label: card.label.toLowerCase(),
      sub: card.available ? (card.helper ?? '') : (card.unavailableReason ?? 'Dados insuficientes'),
      available: card.available
    }));
  }

  private mapJourney(cards: DashboardMetricCard[]): JornadaStep[] {
    return cards.map(card => ({
      icon: this.iconForMetric(card.key),
      value: this.displayMetricValue(card),
      label: card.label.toLowerCase(),
      pct: card.available ? (card.helper ?? '') : (card.unavailableReason ?? 'Dados insuficientes'),
      color: '#84cc16',
      available: card.available
    }));
  }

  private mapActions(items: DashboardHomeResponse['actionQueue']): Acao[] {
    return items
      .filter(item => this.hasImplementedAction(item.targetType))
      .map(item => ({
        prioridade: this.priorityForAction(item.type),
        titulo: item.title,
        descricao: item.description,
        botao: item.actionLabel,
        icone: this.iconForAction(item.type),
        targetType: item.targetType,
        targetId: item.targetId
      }));
  }

  openAction(action: Acao): void {
    if (action.targetType === 'conversation' && action.targetId) {
      void this.router.navigate(['/conversas'], { queryParams: { conversationId: action.targetId } });
      return;
    }
    if (action.targetType === 'conversation-list') {
      void this.router.navigate(['/conversas'], { queryParams: { filter: 'unassigned' } });
    }
  }

  private mapAppointments(items: DashboardHomeResponse['todayAppointments']): Consulta[] {
    return items.map(item => ({
      hora: this.formatTime(item.startsAt),
      nome: item.contactName,
      especialidade: item.serviceName,
      status: this.appointmentStatusLabel(item.status),
      iniciais: this.initials(item.contactName),
      cor: this.avatarColor(item.contactName)
    }));
  }

  metricByKey(cards: DashboardMetricCard[], key: string): DashboardMetricCard | null {
    return cards.find(card => card.key === key) ?? null;
  }

  displayMetricValue(card: DashboardMetricCard | null): number | string {
    if (!card) return 0;
    if (!card.available) return '—';
    return card.value ?? 0;
  }

  metricHelper(card: DashboardMetricCard | null): string {
    if (!card) return '';
    return card.available ? (card.helper ?? '') : (card.unavailableReason ?? 'Dados insuficientes');
  }

  formatPeriod(): string {
    if (!this.home?.period) return '';
    return `${this.formatDate(this.home.period.from)} até ${this.formatDate(this.home.period.to)}`;
  }

  whatsappStatusLabel(): string {
    const whatsapp = this.home?.status.whatsapp;
    if (!whatsapp?.configured) return 'WhatsApp não configurado';
    if (!whatsapp.enabled) return 'WhatsApp desativado';
    if (whatsapp.connectionStatus === 'CONNECTED') return 'WhatsApp conectado';
    return 'WhatsApp requer atenção';
  }

  whatsappBadgeClass(): string {
    const whatsapp = this.home?.status.whatsapp;
    return whatsapp?.configured && whatsapp.enabled && whatsapp.connectionStatus === 'CONNECTED'
      ? 'badge-green'
      : 'badge-orange';
  }

  aiStatusLabel(): string {
    const ai = this.home?.status.ai;
    if (!ai?.configured) return 'IA não configurada';
    if (!ai.enabled) return 'IA desativada';
    return 'IA atendendo normalmente';
  }

  aiBadgeClass(): string {
    const ai = this.home?.status.ai;
    return ai?.configured && ai.enabled ? 'badge-green' : 'badge-yellow';
  }

  getStatusClass(status: string): string {
    if (status === 'Confirmada' || status === 'Concluída') return 'badge-green';
    if (status === 'Aguardando confirmação') return 'badge-yellow';
    return 'badge-orange';
  }

  getPrioridadeCor(p: string): string {
    if (p === 'alta') return '#ef4444';
    if (p === 'media') return '#f59e0b';
    return '#3b82f6';
  }

  getPrioridadeBg(p: string): string {
    if (p === 'alta') return '#fef2f2';
    if (p === 'media') return '#fefce8';
    return '#eff6ff';
  }

  iconForMetric(key: string): string {
    const icons: Record<string, string> = {
      waitingResponse: 'pi-comments',
      overdueTasks: 'pi-check-square',
      unconfirmedAppointments: 'pi-calendar',
      aiTransfers: 'pi-users',
      unassignedConversations: 'pi-user-plus',
      followUpErrors: 'pi-exclamation-triangle',
      newContacts: 'pi-users',
      scheduledAppointments: 'pi-calendar',
      attended: 'pi-check',
      patientsWon: 'pi-heart',
      conversationsStarted: 'pi-comments',
      confirmedAppointments: 'pi-calendar-check',
      noShows: 'pi-user-minus'
    };
    return icons[key] ?? 'pi-chart-bar';
  }

  private iconForAction(type: string): string {
    const icons: Record<string, string> = {
      WAITING_RESPONSE: 'pi-clock',
      UNASSIGNED_CONVERSATIONS: 'pi-users',
      UNCONFIRMED_APPOINTMENT: 'pi-calendar',
      OVERDUE_TASK: 'pi-check-square'
    };
    return icons[type] ?? 'pi-arrow-right';
  }

  private priorityForAction(type: string): 'alta' | 'media' | 'baixa' {
    if (type === 'WAITING_RESPONSE' || type === 'OVERDUE_TASK') return 'alta';
    if (type === 'UNASSIGNED_CONVERSATIONS' || type === 'UNCONFIRMED_APPOINTMENT') return 'media';
    return 'baixa';
  }

  private hasImplementedAction(targetType: string): boolean {
    return targetType === 'conversation' || targetType === 'conversation-list';
  }

  private appointmentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING_CONFIRMATION: 'Aguardando confirmação',
      CONFIRMED: 'Confirmada',
      COMPLETED: 'Concluída',
      NO_SHOW: 'Falta',
      RESCHEDULED: 'Reagendada',
      CANCELLED: 'Cancelada'
    };
    return labels[status] ?? status;
  }

  private formatTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.home?.period.timeZone
    }).format(new Date(value));
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: this.home?.period.timeZone
    }).format(new Date(value));
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'AT';
  }

  private avatarColor(name: string): string {
    const colors = ['#65a30d', '#0891b2', '#7c3aed', '#ea580c', '#0f766e', '#be123c'];
    const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }
}
