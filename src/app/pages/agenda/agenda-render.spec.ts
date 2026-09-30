import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AgendaComponent } from './agenda.component';
import { CalendarService } from './calendar.service';
import { WizardService } from '../wizard-shared/wizard.service';

describe('Agenda rendered controls', () => {
  it('renders the week, switches to month and opens the appointment form', async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaComponent],
      providers: [provideRouter([]), provideNoopAnimations(),
        { provide: CalendarService, useValue: { events: async () => [], appointments: async () => [] } },
        { provide: WizardService, useValue: {} }]
    }).compileComponents();
    const fixture = TestBed.createComponent(AgendaComponent);
    const component = fixture.componentInstance;
    spyOn(component, 'ngOnInit');
    component.config = { source: 'INTERNAL', timeZone: 'America/Sao_Paulo', googleConnected: false, googleCalendarId: null };
    component.anchor = '2026-09-21';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.day-column').length).toBe(7);
    fixture.nativeElement.querySelectorAll('.view-switch button')[2].click();
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.month-day').length).toBe(42);
    fixture.nativeElement.querySelector('.filters .primary').click();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[name="name"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
  });
});
