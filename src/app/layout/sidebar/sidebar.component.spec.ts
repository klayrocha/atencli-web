import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { SidebarComponent } from './sidebar.component';
import { WaitingConversationsService } from '../../whatsapp/waiting-conversations.service';
import { PlanAccessService } from '../../pages/subscription/plan-access.service';
import { unrestrictedPlanAccess } from '../../pages/subscription/plan-access.testing';

describe('Sidebar role visibility', () => {
  it('hides restricted entries for attendants and restores them when the profile changes', () => {
    const attendant = signal(true);
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAttendant: attendant } },
        { provide: WaitingConversationsService, useValue: { count: signal(0), watch() {}, unwatch() {} } }, unrestrictedPlanAccess],
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
        { provide: WaitingConversationsService, useValue: { count, watch() {}, unwatch() {} } }, unrestrictedPlanAccess],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const badge = () => fixture.nativeElement.querySelector('.menu-badge') as HTMLElement | null;
    expect(badge()?.textContent?.trim()).toBe('3');
    count.set(0);
    fixture.detectChanges();
    expect(badge()).toBeNull();
  });

  it('shows the days left of the free trial and the ended trial, linking to the plans', () => {
    const trialEndsAt = signal<string | null>(new Date(Date.now() + 2.5 * 86_400_000).toISOString());
    const attendant = signal(false);
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAttendant: attendant } },
        { provide: WaitingConversationsService, useValue: { count: signal(0), watch() {}, unwatch() {} } },
        { provide: PlanAccessService, useValue: { load: async () => undefined, trialEndsAt } }],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const banner = () => fixture.nativeElement.querySelector('.trial-banner') as HTMLAnchorElement | null;
    expect(banner()?.textContent).toContain('3 dias de teste grátis');
    expect(banner()?.getAttribute('href')).toBe('/subscription');

    trialEndsAt.set(new Date(Date.now() + 3_600_000).toISOString());
    fixture.detectChanges();
    expect(banner()?.textContent).toContain('Último dia de teste');
    expect(banner()?.classList).toContain('last-day');

    trialEndsAt.set(new Date(Date.now() - 1000).toISOString());
    fixture.detectChanges();
    expect(banner()?.textContent).toContain('Teste grátis encerrado');
    expect(banner()?.classList).toContain('expired');

    attendant.set(true);
    fixture.detectChanges();
    expect(banner()).toBeNull();

    attendant.set(false);
    trialEndsAt.set(null);
    fixture.detectChanges();
    expect(banner()).toBeNull();
  });
});
