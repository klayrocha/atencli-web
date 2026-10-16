import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WizardStep6ProfessionalsComponent } from './wizard-step-6-professionals.component';
import { ProfessionalsService } from '../agenda/professionals.service';
import { CalendarService } from '../agenda/calendar.service';
import { WizardService } from '../wizard-shared/wizard.service';
import { OnboardingProgressService } from '../wizard-shared/onboarding-progress.service';

describe('Professional form rendered controls', () => {
  it('loads the list and renders service and schedule fields for a new professional', async () => {
    await TestBed.configureTestingModule({ imports: [WizardStep6ProfessionalsComponent], providers: [
      provideRouter([]),
      { provide: OnboardingProgressService, useValue: { completedSteps: () => 5 } },
      { provide: ProfessionalsService, useValue: { list: async () => [] } },
      { provide: CalendarService, useValue: { configuration: async () => ({ timeZone: 'America/Sao_Paulo' }) } },
      { provide: WizardService, useValue: { getClientServices: async () => ({ services: [{ id: 7, name: 'Consulta' }] }) } },
    ] }).compileComponents();
    const fixture = TestBed.createComponent(WizardStep6ProfessionalsComponent);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum profissional cadastrado');
    fixture.nativeElement.querySelector('.section-heading button').click();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[name="fullName"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.service-options input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    fixture.nativeElement.querySelector('input[name="inheritHours"]').click();
    fixture.detectChanges();
    fixture.componentInstance.addHours(); fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.period-row select')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.step').length).toBe(10);
  });
});
