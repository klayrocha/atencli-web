import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { SidebarComponent } from './sidebar.component';
import { WaitingConversationsService } from '../../whatsapp/waiting-conversations.service';

describe('Sidebar role visibility', () => {
  it('hides restricted entries for attendants and restores them when the profile changes', () => {
    const attendant = signal(true);
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAttendant: attendant } },
        { provide: WaitingConversationsService, useValue: { count: signal(0), watch() {}, unwatch() {} } }],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const labels = () => Array.from(fixture.nativeElement.querySelectorAll('.menu-label'))
      .map(element => (element as HTMLElement).textContent?.trim());
    for (const label of ['Agenda', 'Tarefas', 'Configurações', 'Assinatura']) expect(labels()).not.toContain(label);
    for (const label of ['Início', 'Conversas', 'Etapas do atendimento', 'Ajuda']) expect(labels()).toContain(label);
    attendant.set(false);
    fixture.detectChanges();
    for (const label of ['Agenda', 'Tarefas', 'Configurações', 'Assinatura']) expect(labels()).toContain(label);
  });

  it('shows how many conversations wait for the team next to Conversas', () => {
    const count = signal(3);
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAttendant: signal(false) } },
        { provide: WaitingConversationsService, useValue: { count, watch() {}, unwatch() {} } }],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const badge = () => fixture.nativeElement.querySelector('.menu-badge') as HTMLElement | null;
    expect(badge()?.textContent?.trim()).toBe('3');
    count.set(0);
    fixture.detectChanges();
    expect(badge()).toBeNull();
  });
});
