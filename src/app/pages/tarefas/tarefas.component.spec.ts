import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TarefasComponent } from './tarefas.component';
import { Task, TasksService } from './tasks.service';
import { WizardService } from '../wizard-shared/wizard.service';
import { EtapasService } from '../etapas/etapas.service';
import { CalendarService } from '../agenda/calendar.service';

const task = { id: 10, title: 'Confirmar consulta', status: 'OPEN', type: 'MESSAGE', priority: 'HIGH',
  dueAt: '2026-10-04T15:30:00-03:00', contactName: 'Fernanda Lima', conversationId: 123,
  assigneeUserUuid: 'user', assigneeUserName: 'Mariana Silva', aiLinked: false } as Task;
const summary = { dueToday: 12, highPriorityToday: 7, overdue: 5, dueThisWeek: 9, aiLinkedOpen: 4 };
describe('Tarefas workflows', () => {
  let component: TarefasComponent;
  let api: jasmine.SpyObj<TasksService>;
  beforeEach(() => {
    api = jasmine.createSpyObj('TasksService', ['list', 'summary', 'create', 'update', 'action', 'bulkComplete']);
    api.list.and.resolveTo([]); api.summary.and.resolveTo(summary);
    api.update.and.resolveTo(task); api.create.and.resolveTo(task); api.bulkComplete.and.resolveTo([]);
    component = new TarefasComponent(api, {} as WizardService, {} as EtapasService, {} as CalendarService);
    component.editor = new ElementRef(document.createElement('dialog'));
  });
  it('ignores an older response when filters change', async () => {
    let resolveOld!: (value: typeof summary) => void;
    api.summary.and.returnValue(new Promise(resolve => resolveOld = resolve));
    const first = component.load();
    api.summary.and.resolveTo({ ...summary, dueToday: 1 });
    component.filters = { priority: 'HIGH' };
    await component.load();
    resolveOld(summary); await first;
    expect(component.summary?.dueToday).toBe(1);
    expect(component.loading).toBeFalse();
  });
  it('clears selection when filters are changed', async () => {
    component.selected.add(10); await component.load(); expect(component.selected.size).toBe(0);
  });
  it('concludes only selected tasks and refreshes the board', async () => {
    component.loading = false; component.selected.add(10); component.selected.add(11);
    await component.completeSelected();
    expect(api.bulkComplete).toHaveBeenCalledOnceWith([10, 11]);
    expect(api.list).toHaveBeenCalledTimes(4); expect(component.selected.size).toBe(0);
  });
  it('does not report success or discard selections when a mutation fails', async () => {
    component.loading = false; component.selected.add(10); api.bulkComplete.and.rejectWith({ status: 500 });
    await component.completeSelected();
    expect(component.error).toBeTruthy(); expect(component.notice).toBe('');
    expect(component.selected.has(10)).toBeTrue(); expect(component.busy).toBeFalse();
  });
  it('prevents clearing dueAt because the API ignores null on updates', async () => {
    component.editing = task; component.form.title = task.title; component.form.dueAt = '';
    await component.save(); expect(api.update).not.toHaveBeenCalled(); expect(component.formError).toBeTruthy();
  });
  it('converts a device-local deadline to an offset-bearing ISO instant', async () => {
    component.editing = task; component.form.title = 'Atualizada'; component.form.dueAt = '2026-10-05T14:30';
    await component.save();
    expect(api.update).toHaveBeenCalledWith(10, jasmine.objectContaining({ dueAt: new Date('2026-10-05T14:30').toISOString(), assigneeUserUuid: '' }));
  });
  it('preserves the form on a failed save', async () => {
    component.form.title = 'Nova tarefa'; api.create.and.rejectWith({ status: 400 });
    await component.save(); expect(component.form.title).toBe('Nova tarefa'); expect(component.formError).toBeTruthy();
  });
});

describe('Tarefas rendered page', () => {
  it('renders real counters, contact links, empty columns and the task editor', async () => {
    await TestBed.configureTestingModule({ imports: [TarefasComponent], providers: [provideRouter([]),
      { provide: TasksService, useValue: { summary: async () => summary, list: async (bucket: string) => bucket === 'TODAY' ? [task] : [] } },
      { provide: WizardService, useValue: { getTeam: async () => ({ members: [] }) } },
      { provide: EtapasService, useValue: { listStages: async () => [] } },
      { provide: CalendarService, useValue: { configuration: async () => ({ timeZone: 'America/Sao_Paulo' }) } }]
    }).compileComponents();
    const fixture = TestBed.createComponent(TarefasComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('.task-column').length).toBe(4);
    expect(page.querySelectorAll('.empty').length).toBe(3);
    expect(page.querySelector('.summary-card strong')?.textContent).toBe('12');
    expect(page.querySelector('.card-actions a')?.getAttribute('href')).toContain('conversationId=123');
    (page.querySelector('.title-button') as HTMLButtonElement).click();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(component.editor.nativeElement.open).toBeTrue();
    expect((page.querySelector('input[name=title]') as HTMLInputElement).value).toBe(task.title);
    component.closeEditor(); fixture.destroy();
  });
});
