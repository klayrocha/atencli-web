import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  FollowUpExecution,
  FollowUpExecutionFilters,
  FollowUpExecutionStatus,
  FollowUpService,
  FollowUpTemplate,
  FollowUpTemplateCode,
  FollowUpTemplatePayload,
} from './follow-up.service';

type Tab = 'templates' | 'executions';

interface TemplateForm extends FollowUpTemplatePayload {
  code: FollowUpTemplateCode;
  name: string;
}

@Component({
  selector: 'app-acompanhamento-automatico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './acompanhamento-automatico.component.html',
  styleUrls: ['./acompanhamento-automatico.component.scss'],
})
export class AcompanhamentoAutomaticoComponent implements OnInit {
  readonly days = [
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
    { value: 7, label: 'Dom' },
  ];
  readonly statuses: FollowUpExecutionStatus[] = ['SCHEDULED', 'PROCESSING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED'];
  readonly templateDescriptions: Record<FollowUpTemplateCode, string> = {
    INFORMATION_REQUEST_STOPPED: 'Para conversas em que o contato pediu uma informação e parou de responder.',
    INTEREST_WITHOUT_APPOINTMENT: 'Para contatos qualificados que demonstraram interesse, mas ainda não marcaram.',
    APPOINTMENT_CONFIRMATION: 'Para consultas agendadas que precisam de confirmação antes do atendimento.',
    NO_SHOW: 'Para contatos que faltaram à consulta e precisam de uma retomada cuidadosa.',
    RETURN_REQUESTED: 'Para contatos que pediram retorno em outra data ou ficaram para reativação futura.',
  };

  activeTab: Tab = 'templates';
  templates: FollowUpTemplate[] = [];
  selectedCode: FollowUpTemplateCode | null = null;
  form: TemplateForm | null = null;
  executions: FollowUpExecution[] = [];
  executionFilters: FollowUpExecutionFilters = { size: 50 };
  loadingTemplates = false;
  savingTemplate = false;
  loadingExecutions = false;
  actionId: number | null = null;
  error = '';
  success = '';
  executionError = '';

  constructor(private api: FollowUpService) {}

  ngOnInit(): void {
    void this.loadTemplates();
  }

  get selectedTemplate(): FollowUpTemplate | null {
    return this.templates.find(item => item.code === this.selectedCode) ?? null;
  }

  get activeTemplates(): number {
    return this.templates.filter(item => item.enabled).length;
  }

  get scheduledExecutions(): number {
    return this.executions.filter(item => item.status === 'SCHEDULED' || item.status === 'PROCESSING').length;
  }

  async loadTemplates(): Promise<void> {
    this.loadingTemplates = true;
    this.error = '';
    try {
      this.templates = await this.api.listTemplates();
      const selected = this.selectedTemplate ?? this.templates[0] ?? null;
      if (selected) this.selectTemplate(selected);
    } catch (error) {
      this.error = this.errorMessage(error, 'Não foi possível carregar os modelos de acompanhamento.');
    } finally {
      this.loadingTemplates = false;
    }
  }

  selectTemplate(template: FollowUpTemplate): void {
    this.selectedCode = template.code;
    this.form = {
      code: template.code,
      name: template.name,
      enabled: template.enabled,
      firstDelayMinutes: template.firstDelayMinutes,
      maxMessages: template.maxMessages,
      intervalMinutes: template.intervalMinutes,
      allowedStartTime: this.toInputTime(template.allowedStartTime),
      allowedEndTime: this.toInputTime(template.allowedEndTime),
      activeDays: [...(template.activeDays ?? [])],
      messageOne: template.messageOne ?? '',
      messageTwo: template.messageTwo ?? '',
      messageThree: template.messageThree ?? '',
      responsibleUserUuid: template.responsibleUserUuid,
      createTaskOnFinish: template.createTaskOnFinish,
    };
    this.error = '';
    this.success = '';
  }

  async saveTemplate(): Promise<void> {
    if (!this.form || this.savingTemplate) return;
    this.error = '';
    this.success = '';
    const validation = this.validate(this.form);
    if (validation) {
      this.error = validation;
      return;
    }
    this.savingTemplate = true;
    try {
      const saved = await this.api.updateTemplate(this.form.code, this.toPayload(this.form));
      this.templates = this.templates.map(item => item.code === saved.code ? saved : item);
      this.selectTemplate(saved);
      this.success = 'Modelo salvo com sucesso.';
    } catch (error) {
      this.error = this.errorMessage(error, 'Não foi possível salvar este modelo.');
    } finally {
      this.savingTemplate = false;
    }
  }

  async toggleTemplate(template: FollowUpTemplate): Promise<void> {
    if (this.savingTemplate) return;
    this.error = '';
    this.success = '';
    this.savingTemplate = true;
    try {
      const saved = await this.api.setTemplateStatus(template.code, !template.enabled);
      this.templates = this.templates.map(item => item.code === saved.code ? saved : item);
      if (this.selectedCode === saved.code) this.selectTemplate(saved);
      this.success = saved.enabled ? 'Modelo ativado.' : 'Modelo pausado. Execuções ativas desse modelo serão canceladas.';
    } catch (error) {
      this.error = this.errorMessage(error, 'Não foi possível alterar o status do modelo.');
    } finally {
      this.savingTemplate = false;
    }
  }

  async loadExecutions(): Promise<void> {
    this.loadingExecutions = true;
    this.executionError = '';
    try {
      this.executions = await this.api.listExecutions({
        ...this.executionFilters,
        conversationId: this.executionFilters.conversationId ? Number(this.executionFilters.conversationId) : null,
        size: this.executionFilters.size ?? 50,
      });
    } catch (error) {
      this.executionError = this.errorMessage(error, 'Não foi possível carregar as execuções.');
    } finally {
      this.loadingExecutions = false;
    }
  }

  async setExecutionAction(execution: FollowUpExecution, action: 'pause' | 'resume' | 'cancel'): Promise<void> {
    if (this.actionId) return;
    this.actionId = execution.id;
    this.executionError = '';
    try {
      if (action === 'pause') await this.api.pauseExecution(execution.id);
      if (action === 'resume') await this.api.resumeExecution(execution.id);
      if (action === 'cancel') await this.api.cancelExecution(execution.id);
      await this.loadExecutions();
    } catch (error) {
      this.executionError = this.errorMessage(error, 'Não foi possível atualizar a execução.');
    } finally {
      this.actionId = null;
    }
  }

  openExecutions(): void {
    this.activeTab = 'executions';
    if (!this.executions.length) void this.loadExecutions();
  }

  toggleDay(day: number, checked: boolean): void {
    if (!this.form) return;
    this.form.activeDays = checked
      ? [...new Set([...this.form.activeDays, day])].sort((a, b) => a - b)
      : this.form.activeDays.filter(item => item !== day);
  }

  messagePreview(message: string | null): string {
    return (message || '')
      .replaceAll('{{nome}}', 'Fernanda')
      .replaceAll('{{clinica}}', 'Clínica Atenclin')
      .replaceAll('{{interesse}}', 'avaliação');
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      SCHEDULED: 'Agendada',
      PROCESSING: 'Processando',
      PAUSED: 'Pausada',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
      FAILED: 'Falhou',
    };
    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    return status.toLowerCase();
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

  minutesHint(value: number | null | undefined): string {
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes <= 0) return 'Informe o tempo em minutos.';
    if (minutes < 60) return `${minutes} minutos`;
    if (minutes % 1440 === 0) {
      const days = minutes / 1440;
      return `${minutes} minutos = ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${minutes} minutos = ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${minutes} minutos = ${hours}h ${remainingMinutes}min`;
  }

  private toPayload(form: TemplateForm): FollowUpTemplatePayload {
    const hasWindow = !!form.allowedStartTime && !!form.allowedEndTime;
    return {
      enabled: form.enabled,
      firstDelayMinutes: Number(form.firstDelayMinutes),
      maxMessages: Number(form.maxMessages),
      intervalMinutes: Number(form.intervalMinutes),
      allowedStartTime: hasWindow ? this.toApiTime(form.allowedStartTime) : null,
      allowedEndTime: hasWindow ? this.toApiTime(form.allowedEndTime) : null,
      activeDays: [...form.activeDays],
      messageOne: form.messageOne.trim(),
      messageTwo: form.maxMessages > 1 ? (form.messageTwo?.trim() || null) : null,
      messageThree: form.maxMessages > 2 ? (form.messageThree?.trim() || null) : null,
      responsibleUserUuid: form.responsibleUserUuid?.trim() || null,
      createTaskOnFinish: form.createTaskOnFinish,
    };
  }

  private validate(form: TemplateForm): string {
    if (form.firstDelayMinutes < 5 || form.firstDelayMinutes > 43200) return 'O primeiro atraso deve ficar entre 5 minutos e 30 dias.';
    if (form.intervalMinutes < 15 || form.intervalMinutes > 43200) return 'O intervalo entre mensagens deve ficar entre 15 minutos e 30 dias.';
    if (form.maxMessages < 1 || form.maxMessages > 3) return 'A quantidade de mensagens deve ficar entre 1 e 3.';
    if (!form.messageOne?.trim()) return 'Informe a primeira mensagem.';
    if (form.maxMessages > 1 && !form.messageTwo?.trim()) return 'Informe a segunda mensagem para modelos com mais de uma mensagem.';
    if (form.maxMessages > 2 && !form.messageThree?.trim()) return 'Informe a terceira mensagem para modelos com três mensagens.';
    if ([form.messageOne, form.messageTwo, form.messageThree].some(message => (message?.length ?? 0) > 1000)) return 'Cada mensagem deve ter até 1000 caracteres.';
    const hasStart = !!form.allowedStartTime;
    const hasEnd = !!form.allowedEndTime;
    if (hasStart !== hasEnd) return 'Preencha início e fim da janela de envio, ou deixe os dois vazios.';
    if (hasStart && hasEnd && form.allowedStartTime! >= form.allowedEndTime!) return 'O horário inicial precisa ser anterior ao horário final.';
    return '';
  }

  private toInputTime(value: string | null): string | null {
    return value ? value.slice(0, 5) : null;
  }

  private toApiTime(value: string | null): string | null {
    if (!value) return null;
    return value.length === 5 ? `${value}:00` : value;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
      if (error.status === 403) return 'Você não tem permissão para gerenciar o acompanhamento automático.';
      if (error.status === 400) return 'Revise os campos informados. O backend recusou esta configuração.';
    }
    return fallback;
  }
}
