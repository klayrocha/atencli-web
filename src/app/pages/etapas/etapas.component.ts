import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AttendanceStage, ConversationSummary, EtapasService } from './etapas.service';

interface StageColumn {
  stage: AttendanceStage;
  conversations: ConversationSummary[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string;
}

interface MetricCard {
  icon: string;
  label: string;
  value: number;
  helper: string;
}

@Component({
  selector: 'app-etapas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './etapas.component.html',
  styleUrls: ['./etapas.component.scss'],
})
export class EtapasComponent implements OnInit {
  readonly visibleStageCodes = [
    'NEW_CONTACT',
    'QUALIFIED',
    'APPOINTMENT_SCHEDULED',
    'APPOINTMENT_CONFIRMED',
    'NO_SHOW',
  ];
  stages: AttendanceStage[] = [];
  columns: StageColumn[] = [];
  search = '';
  movingConversationId: number | null = null;
  dragged: { conversation: ConversationSummary; sourceColumn: StageColumn } | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(private api: EtapasService) {}

  ngOnInit(): void {
    void this.loadBoard();
  }

  get totalConversations(): number {
    return this.columns.reduce((sum, column) => sum + column.total, 0);
  }

  get metrics(): MetricCard[] {
    return [
      {
        icon: 'pi pi-users',
        label: 'Total de atendimentos',
        value: this.totalConversations,
        helper: 'em todas as etapas ativas',
      },
      {
        icon: 'pi pi-exclamation-circle',
        label: 'Precisam de atenção',
        value: this.countByCodes(['NEW_CONTACT', 'AWAITING_RESPONSE']),
        helper: 'novos ou aguardando retorno',
      },
      {
        icon: 'pi pi-calendar',
        label: 'Consultas',
        value: this.countByCodes(['APPOINTMENT_SCHEDULED', 'APPOINTMENT_CONFIRMED']),
        helper: 'agendadas e confirmadas',
      },
    ];
  }

  async loadBoard(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.success = '';
    try {
      this.stages = (await this.api.listStages())
        .filter(stage => stage.active && this.visibleStageCodes.includes(stage.systemCode))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      this.columns = this.stages.map(stage => ({
        stage,
        conversations: [],
        total: 0,
        page: 0,
        totalPages: 0,
        loading: true,
        error: '',
      }));
      await Promise.all(this.columns.map(column => this.loadColumn(column, 0, false)));
    } catch (error) {
      this.error = this.errorMessage(error, 'Não foi possível carregar as etapas do atendimento.');
    } finally {
      this.loading = false;
    }
  }

  async loadColumn(column: StageColumn, page: number, append: boolean): Promise<void> {
    column.loading = true;
    column.error = '';
    try {
      const result = await this.api.listConversations({
        page,
        size: 20,
        stageId: column.stage.id,
      });
      column.conversations = append ? [...column.conversations, ...result.content] : result.content;
      column.total = result.page.totalElements;
      column.page = result.page.number;
      column.totalPages = result.page.totalPages;
    } catch (error) {
      column.error = this.errorMessage(error, `Não foi possível carregar ${column.stage.name}.`);
    } finally {
      column.loading = false;
    }
  }

  async loadMore(column: StageColumn): Promise<void> {
    if (column.loading || column.page + 1 >= column.totalPages) return;
    await this.loadColumn(column, column.page + 1, true);
  }

  async changeConversationStage(conversation: ConversationSummary, sourceColumn: StageColumn, targetStageId: number): Promise<void> {
    if (!targetStageId || targetStageId === sourceColumn.stage.id || this.movingConversationId) return;
    const targetColumn = this.columns.find(column => column.stage.id === targetStageId);
    this.movingConversationId = conversation.id;
    this.error = '';
    this.success = '';
    try {
      await this.api.moveConversation(
        conversation.id,
        targetStageId,
        `Movido pelo quadro de etapas de ${sourceColumn.stage.name} para ${targetColumn?.stage.name ?? 'nova etapa'}`
      );
      sourceColumn.conversations = sourceColumn.conversations.filter(item => item.id !== conversation.id);
      sourceColumn.total = Math.max(0, sourceColumn.total - 1);
      if (targetColumn) await this.loadColumn(targetColumn, 0, false);
      this.success = `Conversa movida para ${targetColumn?.stage.name ?? 'a nova etapa'}.`;
    } catch (error) {
      this.error = this.errorMessage(error, 'Não foi possível alterar a etapa da conversa.');
    } finally {
      this.movingConversationId = null;
    }
  }

  dragStart(event: DragEvent, conversation: ConversationSummary, sourceColumn: StageColumn): void {
    this.dragged = { conversation, sourceColumn };
    event.dataTransfer?.setData('text/plain', String(conversation.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  dragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  async dropOnColumn(event: DragEvent, targetColumn: StageColumn): Promise<void> {
    event.preventDefault();
    const dragged = this.dragged;
    this.dragged = null;
    if (!dragged || dragged.sourceColumn.stage.id === targetColumn.stage.id) return;
    await this.changeConversationStage(dragged.conversation, dragged.sourceColumn, targetColumn.stage.id);
  }

  dragEnd(): void {
    this.dragged = null;
  }

  visibleConversations(column: StageColumn): ConversationSummary[] {
    const query = this.normalize(this.search);
    if (!query) return column.conversations;
    return column.conversations.filter(conversation => this.normalize(
      `${conversation.profileName ?? ''} ${conversation.lastMessageText ?? ''} ${conversation.id}`
    ).includes(query));
  }

  stageDescription(stage: AttendanceStage): string {
    const descriptions: Record<string, string> = {
      NEW_CONTACT: 'Primeiro contato',
      IN_SERVICE: 'Em atendimento',
      AWAITING_RESPONSE: 'Aguardando retorno',
      QUALIFIED: 'Qualificado',
      APPOINTMENT_SCHEDULED: 'Consulta marcada',
      APPOINTMENT_CONFIRMED: 'Presença confirmada',
      ATTENDED: 'Consulta realizada',
      NO_SHOW: 'Faltou',
      PATIENT_WON: 'Paciente conquistado',
      LOST: 'Perdido',
      FUTURE_REACTIVATION: 'Reativação futura',
    };
    return descriptions[stage.systemCode] ?? stage.name;
  }

  stageTone(stage: AttendanceStage): string {
    const tones: Record<string, string> = {
      NEW_CONTACT: 'lime',
      IN_SERVICE: 'yellow',
      AWAITING_RESPONSE: 'yellow',
      QUALIFIED: 'green',
      APPOINTMENT_SCHEDULED: 'blue',
      APPOINTMENT_CONFIRMED: 'blue',
      ATTENDED: 'green',
      NO_SHOW: 'orange',
      PATIENT_WON: 'green',
      LOST: 'red',
      FUTURE_REACTIVATION: 'teal',
    };
    return tones[stage.systemCode] ?? 'gray';
  }

  cardPriority(conversation: ConversationSummary, stage: AttendanceStage): string {
    if (stage.systemCode === 'LOST') return 'Perdido';
    if (stage.systemCode === 'PATIENT_WON' || stage.systemCode === 'ATTENDED') return 'Concluído';
    if (stage.systemCode === 'APPOINTMENT_CONFIRMED') return 'Alta';
    if (stage.systemCode === 'NEW_CONTACT' || stage.systemCode === 'QUALIFIED') return 'Baixa';
    if (conversation.updatedAt && Date.now() - new Date(conversation.updatedAt).getTime() > 24 * 60 * 60 * 1000) return 'Alta';
    return 'Média';
  }

  priorityClass(label: string): string {
    const normalized = this.normalize(label);
    if (normalized.includes('alta')) return 'high';
    if (normalized.includes('baixa')) return 'low';
    if (normalized.includes('concluido')) return 'done';
    if (normalized.includes('perdido')) return 'lost';
    return 'medium';
  }

  initials(name: string | null): string {
    const clean = (name || 'Contato').trim();
    return clean.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  formatDate(value: string | null): string {
    if (!value) return 'Sem data';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  private countByCodes(codes: string[]): number {
    return this.columns
      .filter(column => codes.includes(column.stage.systemCode))
      .reduce((sum, column) => sum + column.total, 0);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
      if (error.status === 403) return 'Você não tem permissão para esta ação.';
      if (error.status === 400) return 'Revise os campos informados e tente novamente.';
      if (error.status === 404) return 'Registro não encontrado.';
    }
    return fallback;
  }
}
