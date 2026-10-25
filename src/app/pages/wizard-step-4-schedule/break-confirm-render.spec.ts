import { OnboardingProgressService } from '../wizard-shared/onboarding-progress.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { WizardService } from '../wizard-shared/wizard.service';
import { WizardStepperComponent } from '../wizard-shared/wizard-stepper.component';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import { WizardStep4ScheduleComponent } from './wizard-step-4-schedule.component';

describe('Break confirmation button', () => {
  it('shows validation beside the row, confirms on click, disables fields and keeps delete enabled', async () => {
    await TestBed.configureTestingModule({
      imports: [WizardStep4ScheduleComponent],
      providers: [provideNoopAnimations(),
        { provide: OnboardingProgressService, useValue: { isConfigurationComplete: () => false } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: WizardService, useValue: { getClientAvailability: async () => [] } },
      ],
    }).overrideComponent(WizardStep4ScheduleComponent, {
      remove: { imports: [WizardStepperComponent, WizardSummaryComponent] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    }).compileComponents();
    const fixture = TestBed.createComponent(WizardStep4ScheduleComponent);
    fixture.detectChanges(); await fixture.whenStable();
    const page = fixture.componentInstance;
    page.days[0].active = true; page.days[0].start = '08:00'; page.days[0].end = '18:00';
    page.toggleDayBreak(1); fixture.detectChanges(); await fixture.whenStable();
    const pause = page.breaksForDay(1)[0];
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.break-confirm');
    expect(button.matches(':disabled')).toBeFalse();
    button.click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.break-fields [role="alert"]').textContent).toContain('início');
    Object.assign(pause, { start: '12:00', end: '14:00', description: 'Almoço' });
    fixture.detectChanges(); await fixture.whenStable();
    button.click(); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(page.isBreakConfirmed(pause)).toBeTrue();
    expect(fixture.nativeElement.querySelector('.break-confirm')).toBeNull();
    const fields: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll('.break-inline input');
    fields.forEach(input => expect(input.disabled).toBeTrue());
    const remove: HTMLButtonElement = fixture.nativeElement.querySelector('.break-delete');
    expect(remove.matches(':disabled')).toBeFalse();
    remove.click(); fixture.detectChanges();
    expect(page.breaksForDay(1)).toEqual([]);
  });
});
