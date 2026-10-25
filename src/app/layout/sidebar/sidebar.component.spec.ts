import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { SidebarComponent } from './sidebar.component';

describe('Sidebar role visibility', () => {
  it('hides restricted entries for attendants and restores them when the profile changes', () => {
    const attendant = signal(true);
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAttendant: attendant } }],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const labels = () => Array.from(fixture.nativeElement.querySelectorAll('.menu-label'))
      .map(element => (element as HTMLElement).textContent?.trim());
    for (const label of ['Agenda', 'Tarefas', 'Configurações']) expect(labels()).not.toContain(label);
    for (const label of ['Início', 'Conversas', 'Etapas do atendimento', 'Ajuda']) expect(labels()).toContain(label);
    attendant.set(false);
    fixture.detectChanges();
    for (const label of ['Agenda', 'Tarefas', 'Configurações']) expect(labels()).toContain(label);
  });
});
