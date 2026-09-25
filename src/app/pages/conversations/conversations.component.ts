import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Message { text: string; time: string; outgoing?: boolean; note?: boolean; }
interface Conversation {
  id: number; name: string; preview: string; time: string; status: string; color: string;
  unread: number; mine: boolean; phone: string; email: string; topic: string; origin: string; messages: Message[];
}

@Component({
  selector: 'app-conversations', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './conversations.component.html', styleUrls: ['./conversations.component.scss'],
})
export class ConversationsComponent {
  filter = 'all'; query = ''; unreadOnly = false; ascending = false; searchOpen = false;
  mobileChat = false; contactOpen = false; suggestionsOpen = false; noteMode = false;
  drafts: Record<number, string> = {}; notice = '';
  conversations: Conversation[] = [
    { id: 1, name: 'Fernanda Lima', preview: 'Oi! Gostaria de saber mais sobre implante dentário.', time: '09:18', status: 'Esperando', color: 'yellow', unread: 1, mine: true, phone: '(61) 99999-8888', email: 'fernanda.lima@email.com', topic: 'Implante dentário', origin: 'Instagram', messages: [
      { text: 'Oi! Gostaria de saber mais sobre implante dentário.', time: '09:18' },
      { text: 'Olá, Fernanda! 👋\nTudo bem? Posso te passar algumas informações sobre implante.', time: '09:21', outgoing: true },
      { text: 'Quero saber como funciona e qual o valor.', time: '09:22' },
      { text: 'Claro! Vou te explicar rapidinho.\nAntes, você já fez avaliação com algum dentista?', time: '09:23', outgoing: true },
      { text: 'Ainda não. Essa seria minha primeira avaliação.', time: '09:24' },
    ] },
    { id: 2, name: 'Bruno Martins', preview: 'Tenho interesse em aparelho ortodôntico.', time: '09:07', status: 'Em atendimento', color: 'blue', unread: 0, mine: true, phone: '(61) 98888-7777', email: 'bruno.martins@email.com', topic: 'Ortodontia', origin: 'WhatsApp', messages: [{ text: 'Tenho interesse em aparelho ortodôntico.', time: '09:07' }] },
    { id: 3, name: 'Número não identificado', preview: 'Mensagem de voz (0:32)', time: '08:58', status: 'Sem responsável', color: 'orange', unread: 2, mine: false, phone: '(61) 97777-6666', email: 'Não informado', topic: 'Não informado', origin: 'WhatsApp', messages: [{ text: '🎙 Mensagem de voz · 0:32 (áudio indisponível nesta prévia)', time: '08:58' }] },
    { id: 4, name: 'Juliana Alves', preview: 'Preciso reagendar minha consulta de amanhã.', time: '08:45', status: 'Concluída', color: 'green', unread: 0, mine: true, phone: '(61) 96666-5555', email: 'juliana.alves@email.com', topic: 'Agendamento', origin: 'WhatsApp', messages: [{ text: 'Preciso reagendar minha consulta de amanhã.', time: '08:45' }] },
    { id: 5, name: 'Ricardo Santos', preview: 'Qual o valor da faceta de resina?', time: '08:32', status: 'Aguardando', color: 'yellow', unread: 0, mine: false, phone: '(61) 95555-4444', email: 'ricardo.santos@email.com', topic: 'Faceta de resina', origin: 'WhatsApp', messages: [{ text: 'Qual o valor da faceta de resina?', time: '08:32' }] },
    { id: 6, name: 'Patrícia Gomes', preview: 'Obrigado pelo atendimento!', time: 'Ontem', status: 'Concluída', color: 'green', unread: 0, mine: true, phone: '(61) 94444-3333', email: 'patricia.gomes@email.com', topic: 'Atendimento geral', origin: 'WhatsApp', messages: [{ text: 'Obrigado pelo atendimento!', time: 'Ontem' }] },
  ];
  selected = this.conversations[0];
  get draft() { return this.drafts[this.selected.id] ?? ''; }
  set draft(value: string) { this.drafts[this.selected.id] = value; }
  get mineCount() { return this.conversations.filter(c => c.mine).length; }
  get unassignedCount() { return this.conversations.filter(c => c.status === 'Sem responsável').length; }
  get filteredConversations() {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const list = this.conversations.filter(c => (this.filter === 'all' || (this.filter === 'mine' ? c.mine : c.status === 'Sem responsável')) && (!this.unreadOnly || c.unread > 0) && normalize(c.name + ' ' + c.preview).includes(normalize(this.query)));
    return this.ascending ? [...list].reverse() : list;
  }
  select(conversation: Conversation) { this.selected = conversation; this.mobileChat = true; this.suggestionsOpen = false; this.notice = ''; }
  send() {
    if (!this.draft.trim()) return;
    const text = this.draft.trim();
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    this.selected.messages.push({ text, time, outgoing: true, note: this.noteMode });
    if (!this.noteMode) { this.selected.preview = text; this.selected.time = time; }
    this.draft = '';
    this.notice = this.noteMode ? 'Nota adicionada nesta prévia.' : 'Mensagem adicionada nesta prévia. Nenhuma mensagem foi enviada.';
  }
  useSuggestion(text: string) { this.draft = text; this.noteMode = false; this.suggestionsOpen = false; }
  previewOnly() { this.notice = 'Esta ação estará disponível em uma próxima etapa.'; }
}
