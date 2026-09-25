import { ConversationsComponent } from './conversations.component';

describe('ConversationsComponent local preview', () => {
  let component: ConversationsComponent;
  beforeEach(() => { component = new ConversationsComponent(); });

  it('combines accent-insensitive search with the unread filter', () => {
    component.query = 'numero';
    component.unreadOnly = true;
    expect(component.filteredConversations.map(c => c.id)).toEqual([3]);
    component.filter = 'mine';
    expect(component.filteredConversations).toEqual([]);
  });

  it('keeps drafts and messages isolated when switching contacts', () => {
    component.draft = 'Rascunho de Fernanda';
    component.select(component.conversations[1]);
    expect(component.draft).toBe('');
    component.draft = 'Olá, Bruno';
    component.send();
    expect(component.selected.messages.at(-1)?.text).toBe('Olá, Bruno');
    component.select(component.conversations[0]);
    expect(component.draft).toBe('Rascunho de Fernanda');
    expect(component.selected.messages.some(m => m.text === 'Olá, Bruno')).toBeFalse();
  });

  it('stores an internal note without replacing the contact message preview', () => {
    const preview = component.selected.preview;
    component.noteMode = true;
    component.draft = 'Retornar amanhã';
    component.send();
    expect(component.selected.messages.at(-1)?.note).toBeTrue();
    expect(component.selected.preview).toBe(preview);
    expect(component.draft).toBe('');
  });

  it('does not append blank messages or automatically send suggestions', () => {
    const count = component.selected.messages.length;
    component.draft = '   ';
    component.send();
    component.useSuggestion('Vamos agendar uma avaliação?');
    expect(component.selected.messages.length).toBe(count);
    expect(component.draft).toBe('Vamos agendar uma avaliação?');
  });
});
