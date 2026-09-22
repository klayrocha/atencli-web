import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AiConfiguration, AiConfigurationPayload, AiConfigurationService } from '../../ai/ai-configuration.service';
import { WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';

@Component({
  selector: 'app-wizard-step-7-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WizardSummaryComponent],
  templateUrl: './wizard-step-7-ai.component.html',
  styleUrls: ['./wizard-step-7-ai.component.scss'],
})
export class WizardStep7AiComponent implements OnInit {
  steps = WIZARD_STEPS_DEFAULT.map(step => ({ ...step, current: step.id === 7, completed: step.id < 7 }));
  readonly topics = [
    ['SERVICES', 'Serviços e procedimentos', 'Somente informações cadastradas.'],
    ['PRICES', 'Preços', 'Somente valores existentes na clínica.'],
    ['BUSINESS_HOURS', 'Horários', 'Expediente, intervalos e dias sem atendimento.'],
    ['ADDRESS', 'Endereço', 'Localização cadastrada da clínica.'],
    ['HEALTH_PLANS', 'Planos de saúde', 'Somente convênios confirmados.'],
    ['FREQUENTLY_ASKED_QUESTIONS', 'Perguntas frequentes', 'Respostas previamente aprovadas.'],
    ['DOCUMENTS_AND_PROTOCOLS', 'Documentos e protocolos', 'Conteúdo aprovado pela clínica.'],
  ];
  readonly requiredTriggers = ['HUMAN_REQUEST', 'MEDICAL_QUESTION', 'PAIN_OR_URGENCY', 'MODEL_ERROR'];
  readonly triggers = [
    ['HUMAN_REQUEST', 'Pedido para falar com uma pessoa', 'Quando o contato pedir atendimento humano.'],
    ['MEDICAL_QUESTION', 'Pergunta médica', 'Diagnóstico, prescrição, exames ou tema sensível.'],
    ['PAIN_OR_URGENCY', 'Dor ou urgência', 'Situação que pode precisar de atenção rápida.'],
    ['COMPLAINT', 'Reclamação', 'Insatisfação com serviço ou atendimento.'],
    ['IRRITATION_OR_REPETITION', 'Irritação ou repetição', 'Contato irritado ou conversa sem avanço.'],
    ['MISSING_INFORMATION', 'Informação não cadastrada', 'A base não possui uma resposta segura.'],
    ['LOW_CONFIDENCE', 'Baixa confiança', 'A IA não tem segurança suficiente para responder.'],
    ['OUT_OF_SCOPE', 'Fora do escopo', 'Assunto não atendido pela clínica.'],
    ['OUT_OF_POLICY_NEGOTIATION', 'Negociação fora da regra', 'Exceções de preço ou condição comercial.'],
    ['MODEL_ERROR', 'Erro da IA', 'Não foi possível produzir uma resposta segura.'],
  ];
  readonly days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  model: AiConfigurationPayload = {
    mode: 'ASSISTANT', tone: 'Acolhedor e profissional', responseLength: 'SHORT',
    schedulePolicy: 'FOLLOW_CLINIC_HOURS', serviceStartTime: '07:00', serviceEndTime: '22:00',
    activeDays: [1, 2, 3, 4, 5], introductionMessage: '', outsideHoursMessage: '',
    allowedTopics: [], handoffTriggers: [...this.requiredTriggers],
  };
  enabled = false;
  loading = false;
  saving = false;
  updating = false;
  loaded = false;
  dirty = false;
  error = '';
  success = '';
  constructor(private api: AiConfigurationService, private auth: AuthService, private router: Router) {}
  get canManage() { return (this.auth.currentProfile()?.roles ?? []).some(role => role === 'ADMIN' || role === 'MANAGER'); }
  get busy() { return this.loading || this.saving || this.updating; }
  ngOnInit() { if (this.canManage) void this.load(); }

  async load() {
    if (this.busy) return;
    this.loading = true;
    this.error = '';
    try { this.fill(await this.api.getConfiguration()); }
    catch (error) { this.error = this.errorMessage(error); }
    finally { this.loading = false; }
  }
  private fill(data: AiConfiguration) {
    this.model = {
      mode: data.mode, tone: data.tone, responseLength: data.responseLength,
      schedulePolicy: data.schedulePolicy,
      serviceStartTime: data.serviceStartTime?.slice(0, 5) || '07:00',
      serviceEndTime: data.serviceEndTime?.slice(0, 5) || '22:00',
      activeDays: [...data.activeDays], introductionMessage: data.introductionMessage || '',
      outsideHoursMessage: data.outsideHoursMessage || '', allowedTopics: [...data.allowedTopics],
      handoffTriggers: [...new Set([...data.handoffTriggers, ...this.requiredTriggers])],
    };
    this.enabled = data.enabled;
    this.loaded = true;
    this.dirty = false;
    this.steps = this.steps.map(step => step.id === 7 ? { ...step, completed: !data.usingDefaults } : step);
  }
  changed() { this.dirty = true; this.success = ''; }
  toggleOption(key: 'allowedTopics' | 'handoffTriggers', value: string, checked: boolean) {
    if (key === 'handoffTriggers' && this.requiredTriggers.includes(value)) return;
    this.model[key] = checked ? [...new Set([...this.model[key], value])] : this.model[key].filter(item => item !== value);
    this.changed();
  }
  toggleDay(day: number, checked: boolean) {
    this.model.activeDays = checked ? [...new Set([...this.model.activeDays, day])] : this.model.activeDays.filter(item => item !== day);
    this.changed();
  }
  async save() {
    if (this.busy || !this.loaded || !this.canManage) return;
    this.error = ''; this.success = '';
    const custom = this.model.schedulePolicy === 'CUSTOM_SCHEDULE';
    if (!this.model.tone.trim() || this.model.tone.length > 80) { this.error = 'Informe um tom de voz com até 80 caracteres.'; return; }
    if (custom && (!this.model.activeDays.length || !this.model.serviceStartTime || !this.model.serviceEndTime || this.model.serviceStartTime >= this.model.serviceEndTime)) {
      this.error = 'Selecione pelo menos um dia e um horário de término posterior ao início.'; return;
    }
    if ((this.model.introductionMessage?.length ?? 0) > 500 || (this.model.outsideHoursMessage?.length ?? 0) > 500) {
      this.error = 'As mensagens devem ter até 500 caracteres.'; return;
    }
    const payload: AiConfigurationPayload = {
      ...this.model, tone: this.model.tone.trim(),
      serviceStartTime: custom ? this.model.serviceStartTime : null,
      serviceEndTime: custom ? this.model.serviceEndTime : null,
      activeDays: custom ? [...this.model.activeDays] : [],
      introductionMessage: this.model.introductionMessage?.trim() || null,
      outsideHoursMessage: this.model.outsideHoursMessage?.trim() || null,
      handoffTriggers: [...new Set([...this.model.handoffTriggers, ...this.requiredTriggers])],
    };
    this.saving = true;
    try { this.fill(await this.api.save(payload)); this.success = 'Regras da IA salvas com sucesso.'; }
    catch (error) { this.error = this.errorMessage(error); }
    finally { this.saving = false; }
  }
  async toggleStatus() {
    if (this.busy || !this.loaded || !this.canManage || (!this.enabled && this.dirty)) return;
    this.updating = true; this.error = ''; this.success = '';
    try {
      const data = await this.api.setEnabled(!this.enabled);
      // Status updates must preserve any unsaved form edits.
      this.enabled = data.enabled;
      this.success = this.enabled ? 'IA ativada com as regras salvas.' : 'IA pausada com sucesso.';
    } catch (error) { this.error = this.errorMessage(error); }
    finally { this.updating = false; }
  }
  async goToReview() {
    if (this.busy || !this.loaded) return;
    if (this.dirty) {
      await this.save();
      if (this.dirty || this.error) return;
    }
    await this.router.navigate(['/wizard-step-8-review']);
  }
  private errorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
      if (error.status === 403) return 'Somente administradores e gestores podem configurar a IA.';
      if (error.status === 400) return 'Revise os campos e horários informados e tente novamente.';
    }
    return 'Não foi possível acessar a configuração da IA. Tente novamente.';
  }
}
