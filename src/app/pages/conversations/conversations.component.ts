import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ConversationAssignee, ConversationDetail, ConversationFilter, ConversationMessage, ConversationSummary, ConversationsService } from '../../whatsapp/conversations.service';

@Component({
  selector: 'app-conversations', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './conversations.component.html', styleUrls: ['./conversations.component.scss'],
})
export class ConversationsComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('assignmentDialog', { static: true }) assignmentDialog!: ElementRef<HTMLDialogElement>;
  assignees: ConversationAssignee[] = [];
  loadingAssignees = false;
  assigning = false;
  assignmentError = '';
  private assignmentConversationId: number | null = null;
  private assigneeRequest = 0;
  private failedAvatars = new Set<string>();

  get currentUserUuid() { return this.auth.currentProfile()?.userUuid ?? this.auth.currentUser()?.id; }
  avatar(person: ConversationAssignee | null | undefined): string | null {
    if (!person || this.failedAvatars.has(person.userUuid)) return null;
    return person.avatarUrl || (person.userUuid === this.currentUserUuid ? this.auth.currentUser()?.avatar : null) || null;
  }
  avatarFailed(person: ConversationAssignee) { this.failedAvatars.add(person.userUuid); }
  initials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'AT';
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).padEnd(2, parts[0][0]).toUpperCase();
  }
  async openAssignment() {
    if (!this.detail || this.loadingDetail || this.assigning) return;
    this.assignmentConversationId = this.detail.id;
    this.assignmentDialog.nativeElement.showModal();
    const request = ++this.assigneeRequest;
    this.loadingAssignees = true; this.assignmentError = ''; this.assignees = [];
    try {
      const people = await this.api.assignees();
      if (this.destroyed || request !== this.assigneeRequest) return;
      this.assignees = people.sort((a, b) => Number(b.userUuid === this.currentUserUuid) - Number(a.userUuid === this.currentUserUuid) || a.fullName.localeCompare(b.fullName));
    } catch { if (request === this.assigneeRequest) this.assignmentError = 'Não foi possível carregar os atendentes. Tente novamente.'; }
    finally { if (request === this.assigneeRequest) this.loadingAssignees = false; }
  }
  closeAssignment() { if (!this.assigning) this.assignmentDialog.nativeElement.close(); }
  async assignTo(person: ConversationAssignee) {
    const id = this.assignmentConversationId;
    if (!id || this.assigning || this.loadingAssignees) return;
    const version = this.selectionVersion;
    this.assigning = true; this.assignmentError = '';
    try {
      const result = await this.api.assign(id, person.userUuid);
      if (this.destroyed) return;
      if (version === this.selectionVersion && this.detail?.id === id) {
        this.detail = { ...this.detail, assignee: result.assignee };
      }
      this.assignmentDialog.nativeElement.close();
      if (this.filter !== 'all') await this.load();
    } catch (error) {
      const status = (error as { status?: number })?.status;
      this.assignmentError = status === 403 ? 'Você não tem permissão para atribuir esta conversa.'
        : status === 400 || status === 409 ? 'Não foi possível atribuir. Confira se a conversa está aberta e o atendente está habilitado.'
        : 'Não foi possível atribuir o atendimento. Tente novamente.';
    } finally { this.assigning = false; }
  }

  filter: ConversationFilter = 'all';
  query = '';
  ascending = false;
  searchOpen = false;
  mobileChat = false;
  contactOpen = false;
  drafts: Record<number, string> = {};
  conversations: ConversationSummary[] = [];
  selected: ConversationSummary | null = null;
  detail: ConversationDetail | null = null;
  messages: ConversationMessage[] = [];
  loading = false;
  loadingDetail = false;
  loadingOlder = false;
  sending = false;
  listError = '';
  detailError = '';
  sendError = '';
  listPage = -1;
  listPages = 0;
  total = 0;
  messagePage = -1;
  messagePages = 0;
  private listVersion = 0;
  private selectionVersion = 0;
  private destroyed = false;
  private scrollToLatest = false;
  private targetConversationId: number | null = null;
  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;

  ngAfterViewChecked(): void {
    if (this.scrollToLatest && this.messageList) {
      const list = this.messageList.nativeElement;
      list.scrollTop = list.scrollHeight;
      this.scrollToLatest = false;
    }
  }

  constructor(private api: ConversationsService, private route: ActivatedRoute, private auth: AuthService) {}
  ngOnInit(): void {
    const queryFilter = this.route.snapshot.queryParamMap.get('filter');
    if (queryFilter === 'unassigned') this.filter = 'unassigned';
    const conversationId = Number(this.route.snapshot.queryParamMap.get('conversationId'));
    this.targetConversationId = Number.isFinite(conversationId) && conversationId > 0 ? conversationId : null;
    void this.load();
  }
  ngOnDestroy(): void { this.destroyed = true; this.listVersion++; this.selectionVersion++; }

  get draft() { return this.selected ? this.drafts[this.selected.id] ?? '' : ''; }
  set draft(value: string) { if (this.selected) this.drafts[this.selected.id] = value; }
  get filteredConversations() {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const list = this.conversations.filter(c => normalize(`${c.profileName ?? ''} ${c.lastMessageText ?? ''}`).includes(normalize(this.query)));
    return this.ascending ? [...list].reverse() : list;
  }
  get canSend() { return !!this.detail?.phone && !this.loadingDetail && !this.detailError && !this.sending && !!this.draft.trim() && this.draft.length <= 4096; }

  async setFilter(filter: ConversationFilter): Promise<void> {
    if (filter === this.filter) return;
    this.filter = filter;
    this.clearSelection();
    await this.load();
  }

  async load(more = false): Promise<void> {
    if (more && (this.loading || this.listPage + 1 >= this.listPages)) return;
    const version = ++this.listVersion;
    const page = more ? this.listPage + 1 : 0;
    this.loading = true;
    this.listError = '';
    if (!more) { this.conversations = []; this.total = 0; this.listPage = -1; this.listPages = 0; }
    try {
      const result = await this.api.list(this.filter, page);
      if (this.destroyed || version !== this.listVersion) return;
      this.conversations = this.unique([...(more ? this.conversations : []), ...result.content]);
      this.listPage = result.page.number;
      this.listPages = result.page.totalPages;
      this.total = result.page.totalElements;
      if (!more) {
        const target = this.targetConversationId
          ? this.conversations.find(c => c.id === this.targetConversationId)
          : null;
        if (target) {
          this.targetConversationId = null;
          await this.select(target, false);
        } else if (this.targetConversationId) {
          await this.selectById(this.targetConversationId);
        } else {
          const next = this.conversations.find(c => c.id === this.selected?.id) ?? this.conversations[0];
          if (next) await this.select(next, false);
          else this.clearSelection();
        }
      }
    } catch (error) {
      if (version === this.listVersion && !this.destroyed) this.listError = this.errorMessage(error, 'carregar as conversas');
    } finally { if (version === this.listVersion) this.loading = false; }
  }

  async select(conversation: ConversationSummary, openOnMobile = true): Promise<void> {
    const version = ++this.selectionVersion;
    this.selected = conversation;
    this.detail = null;
    this.messages = [];
    this.messagePage = -1;
    this.messagePages = 0;
    this.loadingOlder = false;
    this.loadingDetail = true;
    this.detailError = '';
    this.sendError = '';
    this.contactOpen = false;
    if (openOnMobile) this.mobileChat = true;
    try {
      const [detail, messages] = await Promise.all([this.api.detail(conversation.id), this.api.messages(conversation.id)]);
      if (this.destroyed || version !== this.selectionVersion) return;
      this.detail = detail;
      this.messages = messages.content;
      this.scrollToLatest = true;
      this.messagePage = messages.page.number;
      this.messagePages = messages.page.totalPages;
    } catch (error) {
      if (version === this.selectionVersion && !this.destroyed) this.detailError = this.errorMessage(error, 'carregar esta conversa');
    } finally { if (version === this.selectionVersion) this.loadingDetail = false; }
  }

  async selectById(conversationId: number): Promise<void> {
    const version = ++this.selectionVersion;
    this.selected = {
      id: conversationId,
      profileName: null,
      stage: null,
      updatedAt: null,
      lastMessageText: null,
    };
    this.detail = null;
    this.messages = [];
    this.messagePage = -1;
    this.messagePages = 0;
    this.loadingOlder = false;
    this.loadingDetail = true;
    this.detailError = '';
    this.sendError = '';
    this.contactOpen = false;
    this.mobileChat = true;
    try {
      const [detail, messages] = await Promise.all([this.api.detail(conversationId), this.api.messages(conversationId)]);
      if (this.destroyed || version !== this.selectionVersion) return;
      this.detail = detail;
      this.messages = messages.content;
      const latestMessage = messages.content.length ? messages.content[messages.content.length - 1] : null;
      this.selected = {
        id: detail.id,
        profileName: detail.profileName || detail.name,
        stage: detail.stage,
        updatedAt: latestMessage?.createdAt ?? null,
        lastMessageText: latestMessage?.textBody ?? null,
      };
      this.conversations = this.unique([this.selected, ...this.conversations]);
      this.scrollToLatest = true;
      this.messagePage = messages.page.number;
      this.messagePages = messages.page.totalPages;
      this.targetConversationId = null;
    } catch (error) {
      if (version === this.selectionVersion && !this.destroyed) this.detailError = this.errorMessage(error, 'carregar esta conversa');
    } finally { if (version === this.selectionVersion) this.loadingDetail = false; }
  }

  async loadOlder(): Promise<void> {
    if (!this.selected || this.loadingOlder || this.messagePage + 1 >= this.messagePages) return;
    const version = this.selectionVersion;
    this.loadingOlder = true;
    this.sendError = '';
    try {
      const page = await this.api.messages(this.selected.id, this.messagePage + 1);
      if (this.destroyed || version !== this.selectionVersion) return;
      this.messages = this.unique([...page.content, ...this.messages]);
      this.messagePage = page.page.number;
      this.messagePages = page.page.totalPages;
    } catch (error) {
      if (version === this.selectionVersion && !this.destroyed) this.sendError = this.errorMessage(error, 'carregar mensagens anteriores');
    } finally { if (version === this.selectionVersion) this.loadingOlder = false; }
  }

  async send(): Promise<void> {
    if (!this.canSend || !this.selected || !this.detail?.phone) return;
    const id = this.selected.id;
    const draft = this.draft;
    const version = this.selectionVersion;
    this.sending = true;
    this.sendError = '';
    try {
      const message = await this.api.send(this.detail.phone, draft.trim());
      if (this.destroyed) return;
      if (message.status === 'FAILED') {
        if (version === this.selectionVersion) this.sendError = 'Não foi possível enviar a mensagem. O texto foi mantido para você tentar novamente.';
        return;
      }
      if (this.drafts[id] === draft) this.drafts[id] = '';
      if (version === this.selectionVersion) {
        this.messages = this.unique([...this.messages, message]);
        this.scrollToLatest = true;
      }
      this.conversations = this.conversations.map(c => c.id === id ? { ...c, lastMessageText: message.textBody, updatedAt: message.createdAt } : c)
        .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    } catch (error) {
      if (version === this.selectionVersion && !this.destroyed) this.sendError = this.errorMessage(error, 'enviar a mensagem');
    } finally { this.sending = false; }
  }

  messageText(message: ConversationMessage): string {
    if (message.textBody) return message.textBody;
    const types: Record<string, string> = { audio: 'Mensagem de áudio', image: 'Imagem', video: 'Vídeo', document: 'Documento', sticker: 'Figurinha', location: 'Localização', contacts: 'Contato' };
    return `${types[message.messageType.toLowerCase()] ?? 'Mensagem sem texto'} (visualização indisponível)`;
  }
  messageStatus(status: string): string {
    const labels: Record<string, string> = { SENT: 'Enviada', DELIVERED: 'Entregue', READ: 'Lida', FAILED: 'Falha no envio', PENDING: 'Pendente', RECEIVED: 'Recebida' };
    return labels[status.toUpperCase()] ?? status;
  }
  private clearSelection(): void {
    this.selectionVersion++;
    this.selected = null; this.detail = null; this.messages = [];
    this.loadingDetail = false; this.loadingOlder = false; this.mobileChat = false; this.contactOpen = false;
  }
  private unique<T extends { id: number }>(items: T[]): T[] { return [...new Map(items.map(item => [item.id, item])).values()]; }
  private errorMessage(error: unknown, action: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
      if (error.status === 403) return 'Você não tem permissão para esta ação.';
      if (error.status === 404) return 'Conversa não encontrada. Atualize a lista.';
      if (error.status === 400) return 'Não foi possível concluir a ação. Verifique se a integração está ativa e se a janela de atendimento de 24 horas está aberta.';
    }
    return `Não foi possível ${action}. Tente novamente.`;
  }
}
