import { ConversationsComponent } from './conversations.component';
import { ApiPage, ConversationDetail, ConversationMessage, ConversationSummary, ConversationsService } from '../../whatsapp/conversations.service';

const page = <T>(content: T[], number = 0, totalPages = 1): ApiPage<T> => ({ content, page: { number, size: 50, totalElements: content.length, totalPages } });
const summary = (id: number): ConversationSummary => ({ id, profileName: `Contato ${id}`, stage: 'Novo', updatedAt: '2026-09-27T12:00:00Z', lastMessageText: 'Olá' });
const detail = (id: number): ConversationDetail => ({ id, name: `Contato ${id}`, profileName: null, email: null, birthDate: null, phone: '5561999998888', city: null, profession: null, preferredContactTime: null, interestTags: [], origin: 'WhatsApp', stage: 'Novo', assignee: null });
const message = (id: number): ConversationMessage => ({ id, metaMessageId: 'meta', direction: 'OUTBOUND', source: 'CLOUD_API', messageType: 'text', textBody: 'Olá', status: 'SENT', errorText: null, metaTimestamp: null, createdAt: '2026-09-27T12:00:00Z' });

describe('Conversations API integration', () => {
  let component: ConversationsComponent;
  let api: jasmine.SpyObj<ConversationsService>;
  beforeEach(() => {
    api = jasmine.createSpyObj('ConversationsService', ['list', 'detail', 'messages', 'send']);
    api.list.and.resolveTo(page([summary(1)]));
    api.detail.and.callFake(async id => detail(id));
    api.messages.and.resolveTo(page([message(1)]));
    api.send.and.resolveTo(message(2));
    component = new ConversationsComponent(api);
  });
  it('loads summaries, contact data and messages without mock contacts', async () => {
    expect(component.conversations).toEqual([]);
    await component.load();
    expect(api.list).toHaveBeenCalledWith('all', 0);
    expect(component.detail?.id).toBe(1);
    expect(component.messages.length).toBe(1);
  });
  it('uses server filters and loads additional pages', async () => {
    api.list.and.resolveTo(page([summary(2)], 0, 2));
    await component.setFilter('mine');
    expect(api.list).toHaveBeenCalledWith('mine', 0);
    api.list.and.resolveTo(page([summary(3)], 1, 2));
    await component.load(true);
    expect(api.list).toHaveBeenCalledWith('mine', 1);
    expect(component.conversations.map(c => c.id)).toEqual([2, 3]);
    await component.setFilter('unassigned');
    expect(api.list).toHaveBeenCalledWith('unassigned', 0);
  });
  it('ignores a stale contact response after another conversation is selected', async () => {
    let finish!: (value: ConversationDetail) => void;
    api.detail.and.callFake(id => id === 1 ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(detail(id)));
    const first = component.select(summary(1));
    await component.select(summary(2));
    finish(detail(1));
    await first;
    expect(component.selected?.id).toBe(2);
    expect(component.detail?.id).toBe(2);
  });
  it('keeps drafts separate and adds messages only after successful sending', async () => {
    await component.select(summary(1));
    component.draft = 'Rascunho 1';
    await component.select(summary(2));
    expect(component.draft).toBe('');
    component.draft = 'Resposta';
    await component.send();
    expect(api.send).toHaveBeenCalledWith('5561999998888', 'Resposta');
    expect(component.messages.map(m => m.id)).toEqual([1, 2]);
    expect(component.draft).toBe('');
    await component.select(summary(1));
    expect(component.draft).toBe('Rascunho 1');
  });
  it('preserves the draft after send failure and prevents duplicate sends', async () => {
    await component.select(summary(1));
    let fail!: (error: Error) => void;
    api.send.and.returnValue(new Promise((_, reject) => { fail = reject; }));
    component.draft = 'Resposta';
    const sending = component.send();
    await component.send();
    expect(api.send).toHaveBeenCalledTimes(1);
    fail(new Error('offline'));
    await sending;
    expect(component.draft).toBe('Resposta');
    expect(component.sendError).toBeTruthy();
    expect(component.messages.length).toBe(1);
  });
  it('prepends older messages and removes overlapping IDs', async () => {
    api.messages.and.resolveTo(page([message(2)], 0, 2));
    await component.select(summary(1));
    api.messages.and.resolveTo(page([message(1), message(2)], 1, 2));
    await component.loadOlder();
    expect(component.messages.map(m => m.id)).toEqual([1, 2]);
  });
  it('shows errors and clears selection for an empty response', async () => {
    api.list.and.rejectWith(new Error('offline'));
    await component.load();
    expect(component.listError).toBeTruthy();
    expect(component.loading).toBeFalse();
    api.list.and.resolveTo(page([]));
    await component.load();
    expect(component.selected).toBeNull();
    expect(component.listError).toBe('');
  });
  it('does not write a pending sent message into a different conversation', async () => {
    await component.select(summary(1));
    let finish!: (value: ConversationMessage) => void;
    api.send.and.returnValue(new Promise(resolve => { finish = resolve; }));
    component.draft = 'Resposta';
    const sending = component.send();
    await component.select(summary(2));
    finish(message(99));
    await sending;
    expect(component.messages.some(m => m.id === 99)).toBeFalse();
  });
});
