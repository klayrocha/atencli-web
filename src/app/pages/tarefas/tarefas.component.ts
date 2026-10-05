import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AttendanceStage, ConversationSummary, EtapasService } from '../etapas/etapas.service';
import { TeamMemberResponse, WizardService } from '../wizard-shared/wizard.service';
import { CalendarService } from '../agenda/calendar.service';
import { Task, TaskBucket, TaskFilters, TaskPayload, TaskPriority, TasksService, TaskSummary, TaskType } from './tasks.service';

@Component({
  selector: 'app-tarefas', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tarefas.component.html', styleUrl: './tarefas.component.scss'
})
export class TarefasComponent implements OnInit, OnDestroy {
  @ViewChild('editor', { static: true }) editor!: ElementRef<HTMLDialogElement>;
  readonly columns: { bucket: TaskBucket; label: string; icon: string; empty: string }[] = [
    { bucket: 'OVERDUE', label: 'Atrasadas', icon: 'pi-clock', empty: 'Tudo em dia por aqui.' },
    { bucket: 'TODAY', label: 'Hoje', icon: 'pi-calendar', empty: 'Nenhuma tarefa para hoje.' },
    { bucket: 'UPCOMING', label: 'Próximas', icon: 'pi-calendar-plus', empty: 'Nenhuma tarefa programada.' },
    { bucket: 'COMPLETED', label: 'Concluídas', icon: 'pi-check-circle', empty: 'As tarefas concluídas aparecem aqui.' }
  ];
  readonly priorities: { value: TaskPriority; label: string }[] = [{ value: 'HIGH', label: 'Alta' }, { value: 'MEDIUM', label: 'Média' }, { value: 'LOW', label: 'Baixa' }];
  readonly types: { value: TaskType; label: string }[] = [
    { value: 'MESSAGE', label: 'Mensagem' }, { value: 'CALL', label: 'Ligação' },
    { value: 'APPOINTMENT_CONFIRMATION', label: 'Confirmação de consulta' }, { value: 'RESCHEDULE', label: 'Reagendamento' },
    { value: 'PAYMENT', label: 'Pagamento' }, { value: 'AI_REVIEW', label: 'Revisão da IA' },
    { value: 'STAGE_UPDATE', label: 'Atualização de etapa' }, { value: 'MANUAL', label: 'Manual' }
  ];
  tasks: Record<TaskBucket, Task[]> = { OVERDUE: [], TODAY: [], UPCOMING: [], COMPLETED: [] };
  expanded = new Set<TaskBucket>();
  summary: TaskSummary | null = null;
  filters: TaskFilters = {};
  team: TeamMemberResponse[] = [];
  stages: AttendanceStage[] = [];
  contacts: ConversationSummary[] = [];
  contactWarning = '';
  loading = true;
  busy = false;
  error = '';
  notice = '';
  referenceWarning = '';
  formError = '';
  bulkMode = false;
  selected = new Set<number>();
  editing: Task | null = null;
  form = this.blankForm();
  timeZone = 'America/Sao_Paulo';
  readonly inputTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private requestVersion = 0;
  private destroyed = false;

  constructor(private api: TasksService, private wizard: WizardService, private etapas: EtapasService, private calendar: CalendarService) {}
  ngOnInit() { void this.load(); void this.loadReferences(); }
  ngOnDestroy() { this.destroyed = true; this.requestVersion++; }
  async loadReferences() {
    const results = await Promise.allSettled([this.wizard.getTeam(), this.etapas.listStages(), this.calendar.configuration()]);
    if (this.destroyed) return;
    if (results[0].status === 'fulfilled') this.team = results[0].value.members.filter(m => m.status === 'ACTIVE');
    if (results[1].status === 'fulfilled') this.stages = results[1].value.filter(s => s.active);
    if (results[2].status === 'fulfilled') this.timeZone = results[2].value.timeZone;
    if (results.some(r => r.status === 'rejected')) this.referenceWarning = 'Algumas opções de equipe, etapas ou fuso horário não puderam ser carregadas.';
  }
  async load() {
    const version = ++this.requestVersion;
    this.loading = true; this.error = ''; this.selected.clear();
    const filters = { ...this.filters };
    try {
      const [summary, lists] = await Promise.all([this.api.summary(), Promise.all(this.columns.map(c => this.api.list(c.bucket, filters)))]);
      if (version !== this.requestVersion) return;
      this.summary = summary;
      this.columns.forEach((c, i) => this.tasks[c.bucket] = lists[i]);
    } catch {
      if (version === this.requestVersion) this.error = 'Não foi possível carregar as tarefas. Tente novamente.';
    } finally { if (version === this.requestVersion) this.loading = false; }
  }
  clearFilters() { this.filters = {}; void this.load(); }
  get linkedContacts() {
    const contacts = new Map<number, Task>();
    Object.values(this.tasks).flat().forEach(task => {
      if (task.conversationId && !contacts.has(task.conversationId)) contacts.set(task.conversationId, task);
    });
    return [...contacts.values()];
  }
  visible(bucket: TaskBucket) { return this.expanded.has(bucket) ? this.tasks[bucket] : this.tasks[bucket].slice(0, 3); }
  toggleExpanded(bucket: TaskBucket) { this.expanded.has(bucket) ? this.expanded.delete(bucket) : this.expanded.add(bucket); }
  toggleBulk() { this.bulkMode = !this.bulkMode; this.selected.clear(); }
  select(task: Task) { this.selected.has(task.id) ? this.selected.delete(task.id) : this.selected.add(task.id); }
  priorityLabel(priority: TaskPriority) { return this.priorities.find(p => p.value === priority)?.label; }
  initials(name: string | null) { return name ? name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?'; }
  dateLabel(task: Task, bucket: TaskBucket) {
    const value = bucket === 'COMPLETED' ? task.completedAt : task.dueAt;
    if (!value) return 'Sem prazo definido';
    const date = new Intl.DateTimeFormat('pt-BR', { timeZone: this.timeZone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
    return `${bucket === 'COMPLETED' ? 'Concluída em' : bucket === 'OVERDUE' ? 'Atrasada desde' : 'Prazo:'} ${date}`;
  }
  private blankForm() {
    return { title: '', description: '', type: 'MANUAL' as TaskType, priority: 'MEDIUM' as TaskPriority,
      assigneeUserUuid: '', dueAt: '', aiLinked: false, conversationId: null as number | null, appointmentId: null as number | null };
  }
  openEditor(task?: Task) {
    if (this.busy || (task && task.status !== 'OPEN')) return;
    this.editing = task ?? null; this.formError = '';
    this.form = task ? { title: task.title, description: task.description ?? '', type: task.type, priority: task.priority,
      assigneeUserUuid: task.assigneeUserUuid ?? '', dueAt: this.localDate(task.dueAt), aiLinked: task.aiLinked,
      conversationId: task.conversationId, appointmentId: task.appointmentId } : this.blankForm();
    this.editor.nativeElement.showModal();
    if (!task) void this.loadContacts();
  }
  async loadContacts() {
    this.contactWarning = '';
    try {
      const page = await this.etapas.listConversations({ size: 200 });
      if (this.destroyed) return;
      this.contacts = page.content;
      if (page.page.totalElements > 200) this.contactWarning = 'Mostrando os 200 contatos mais recentes.';
    } catch { this.contactWarning = 'Não foi possível carregar os contatos. Você pode criar a tarefa sem vínculo.'; }
  }
  private localDate(value: string | null) {
    if (!value) return '';
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  closeEditor() { if (!this.busy) this.editor.nativeElement.close(); }
  async save() {
    if (this.busy || !this.form.title.trim()) return;
    if (this.editing?.dueAt && !this.form.dueAt) { this.formError = 'O prazo existente precisa ser mantido ou substituído.'; return; }
    this.busy = true; this.formError = ''; this.notice = '';
    try {
      const payload: TaskPayload = { ...this.form, title: this.form.title.trim(),
        dueAt: this.form.dueAt ? new Date(this.form.dueAt).toISOString() : null,
        assigneeUserUuid: this.form.assigneeUserUuid || (this.editing ? '' : null) };
      if (this.editing) await this.api.update(this.editing.id, payload);
      else await this.api.create(payload);
      this.editor.nativeElement.close(); this.notice = this.editing ? 'Tarefa atualizada.' : 'Tarefa criada.';
      await this.load();
    } catch { this.formError = 'Não foi possível salvar. Confira os dados e tente novamente.'; }
    finally { this.busy = false; }
  }
  async action(task: Task, action: 'complete' | 'reopen' | 'cancel') {
    if (this.busy || this.loading) return;
    if (action === 'cancel' && !window.confirm(`Cancelar a tarefa “${task.title}”?`)) return;
    await this.mutate(() => this.api.action(task.id, action), action === 'complete' ? 'Tarefa concluída.' : action === 'reopen' ? 'Tarefa reaberta.' : 'Tarefa cancelada.');
  }
  async completeSelected() {
    if (!this.selected.size || this.busy || this.loading) return;
    const ids = [...this.selected];
    await this.mutate(() => this.api.bulkComplete(ids), `${ids.length} tarefa(s) concluída(s).`);
  }
  private async mutate(operation: () => Promise<unknown>, message: string) {
    this.busy = true; this.error = ''; this.notice = '';
    try { await operation(); this.notice = message; await this.load(); }
    catch { this.error = 'Não foi possível realizar a ação. Atualize a lista e tente novamente.'; }
    finally { this.busy = false; }
  }
}
