import { AuthService } from '../../auth/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ConversationsComponent } from './conversations.component';
import { ApiPage, ConversationDetail, ConversationMessage, ConversationSummary, ConversationsService } from '../../whatsapp/conversations.service';
import { withPlanAccess } from '../subscription/plan-access.testing';
import { WaitingConversationsService } from '../../whatsapp/waiting-conversations.service';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

const page = <T>(content: T[], number = 0, totalPages = 1): ApiPage<T> => ({ content, page: { number, size: 50, totalElements: content.length, totalPages } });
const summary = (id: number): ConversationSummary => ({ id, profileName: `Contato ${id}`, stage: 'Novo', updatedAt: '2026-09-27T12:00:00Z', lastMessageText: 'Olá' });
const detail = (id: number): ConversationDetail => ({ id, name: `Contato ${id}`, profileName: null, email: null, birthDate: null, phone: '5561999998888', city: null, profession: null, preferredContactTime: null, interestTags: [], origin: 'WhatsApp', stage: 'Novo', assignee: null });
const message = (id: number): ConversationMessage => ({ id, metaMessageId: 'meta', direction: 'OUTBOUND', source: 'CLOUD_API', messageType: 'text', textBody: 'Olá', status: 'SENT', errorText: null, metaTimestamp: null, createdAt: '2026-09-27T12:00:00Z' });

describe('Conversations API integration', () => {
  let component: ConversationsComponent;
  let api: jasmine.SpyObj<ConversationsService>;
  let waiting: { count: ReturnType<typeof signal<number>>; refresh: jasmine.Spy };
  beforeEach(() => {
    waiting = { count: signal(0), refresh: jasmine.createSpy('refresh').and.resolveTo() };
    TestBed.configureTestingModule({ providers: [{ provide: WaitingConversationsService, useValue: waiting }] });
    api = jasmine.createSpyObj('ConversationsService', ['list', 'detail', 'messages', 'send', 'sendInstagram', 'assignees', 'assign']);
    api.list.and.resolveTo(page([summary(1)]));
    api.detail.and.callFake(async id => detail(id));
    api.messages.and.resolveTo(page([message(1)]));
    api.send.and.resolveTo(message(2));
    api.sendInstagram.and.resolveTo({ ...message(2), source: 'INSTAGRAM_API' });
    component = withPlanAccess(() => new ConversationsComponent(api, {} as ActivatedRoute, { currentProfile: () => ({ userUuid: 'me' }), currentUser: () => null } as unknown as AuthService));
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
    await component.setFilter('waiting');
    expect(api.list).toHaveBeenCalledWith('waiting', 0);
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
  it('sends Instagram replies using the Instagram account ID without a phone', async () => {
    api.list.and.resolveTo(page([{ ...summary(1), channel: 'INSTAGRAM' }]));
    api.detail.and.resolveTo({ ...detail(1), channel: 'INSTAGRAM', externalContactId: 'ig-contact', phone: null });
    await component.load();
    component.draft = 'Resposta no Instagram';
    expect(component.canSend).toBeTrue();
    await component.send();
    expect(api.sendInstagram).toHaveBeenCalledWith('ig-contact', 'Resposta no Instagram');
    expect(api.send).not.toHaveBeenCalled();
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
  it('lists the logged-in attendant first and persists the selected assignment', async () => {
    await component.select(summary(1));
    component.assignmentDialog = { nativeElement: { showModal: () => {}, close: () => {} } } as any;
    const me = { userUuid: 'me', fullName: 'Atendente atual' };
    api.assignees.and.resolveTo([{ userUuid: 'other', fullName: 'Colega' }, me]);
    api.assign.and.resolveTo({ assignee: me, handlerType: 'HUMAN' });
    await component.openAssignment();
    expect(component.assignees[0]).toEqual(me);
    await component.assignTo(me);
    expect(api.assign).toHaveBeenCalledWith(1, 'me');
    expect(component.detail?.assignee).toEqual(me);
  });
  it('assigning a waiting conversation removes it from the waiting count', async () => {
    api.list.and.resolveTo({ ...page([{ ...summary(1), waitingForTeam: true, handoffReason: 'IA: pergunta sobre medicação' }]),
      page: { number: 0, size: 50, totalElements: 4, totalPages: 1 } });
    api.detail.and.resolveTo({ ...detail(1), waitingForTeam: true, handoffReason: 'IA: pergunta sobre medicação', handoffAt: '2026-09-27T12:00:00Z' });
    await component.setFilter('waiting');
    expect(waiting.count()).toBe(4);
    expect(component.handoffReason(component.detail?.handoffReason)).toBe('pergunta sobre medicação');
    component.assignmentDialog = { nativeElement: { showModal: () => {}, close: () => {} } } as any;
    const me = { userUuid: 'me', fullName: 'Atendente atual' };
    api.assignees.and.resolveTo([me]);
    api.assign.and.resolveTo({ assignee: me, handlerType: 'HUMAN' });
    await component.openAssignment();
    api.detail.and.resolveTo({ ...detail(1), assignee: me, waitingForTeam: false });
    await component.assignTo(me);
    expect(component.detail?.waitingForTeam).toBeFalse();
    expect(waiting.refresh).toHaveBeenCalled();
  });
  it('describes how long the conversation has been waiting', () => {
    const now = Date.parse('2026-09-27T12:00:00Z');
    expect(component.waitingSince('2026-09-27T11:59:40Z', now)).toBe('agora');
    expect(component.waitingSince('2026-09-27T11:48:00Z', now)).toBe('há 12 min');
    expect(component.waitingSince('2026-09-27T09:00:00Z', now)).toBe('há 3 h');
    expect(component.waitingSince('2026-09-25T12:00:00Z', now)).toBe('há 2 dias');
    expect(component.handoffReason(null)).toBe('A IA transferiu a conversa para a equipe.');
  });
  it('preserves the assignee when assignment fails', async () => {
    await component.select(summary(1));
    component.assignmentDialog = { nativeElement: { showModal: () => {}, close: () => {} } } as any;
    api.assignees.and.resolveTo([{ userUuid: 'me', fullName: 'Atendente' }]);
    await component.openAssignment(); api.assign.and.rejectWith({ status: 403 });
    await component.assignTo(component.assignees[0]);
    expect(component.detail?.assignee).toBeNull();
    expect(component.assignmentError).toContain('permissão');
  });
  it('does not change another conversation after a delayed assignment response', async () => {
    await component.select(summary(1));
    component.assignmentDialog = { nativeElement: { showModal: () => {}, close: () => {} } } as any;
    const me = { userUuid: 'me', fullName: 'Atendente' };
    api.assignees.and.resolveTo([me]); await component.openAssignment();
    let finish!: (value: { assignee: typeof me; handlerType: string }) => void;
    api.assign.and.returnValue(new Promise(resolve => finish = resolve));
    const saving = component.assignTo(me);
    await component.select(summary(2)); finish({ assignee: me, handlerType: 'HUMAN' }); await saving;
    expect(component.detail?.id).toBe(2); expect(component.detail?.assignee).toBeNull();
  });
  it('uses two initials for full, single and blank names', () => {
    expect(component.initials('Helder Gonzaga')).toBe('HG');
    expect(component.initials('  Helder da Silva Gonzaga  ')).toBe('HG');
    expect(component.initials('Maria')).toBe('MA');
    expect(component.initials('H')).toBe('HH');
    expect(component.initials('')).toBe('AT');
  });

});
