import { Router } from '@angular/router';
import { WizardService } from './wizard.service';
import { OnboardingProgressService } from './onboarding-progress.service';
import { WizardStep1AboutComponent } from '../wizard-step-1-about/wizard-step-1-about.component';
import { WizardStep2SpecialtyComponent } from '../wizard-step-2-specialty/wizard-step-2-specialty.component';
import { WizardStep4ScheduleComponent } from '../wizard-step-4-schedule/wizard-step-4-schedule.component';

describe('Configuration persistence', () => {
  let router: jasmine.SpyObj<Router>;
  let api: jasmine.SpyObj<WizardService>;
  const complete = { isConfigurationComplete: () => true } as OnboardingProgressService;
  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    api = jasmine.createSpyObj('WizardService', ['getStates', 'getClientTypes', 'getHealthPlans', 'getAbout', 'getClientHealthPlans', 'saveAbout', 'saveHealthPlans', 'getSpecialtiesByTypeClients', 'getClientSpecialties', 'saveSpecialties', 'getClientAvailability', 'deleteAvailability']);
    api.getStates.and.resolveTo([]); api.getClientTypes.and.resolveTo([]); api.getHealthPlans.and.resolveTo([]);
    api.getAbout.and.resolveTo({ clientName: 'API clinic', typeClientId: 1, description: 'Clinic', cityName: 'City', stateId: 1, phoneNumber: '+5511999999999', email: 'clinic@example.test', acceptsHealthPlan: false } as Awaited<ReturnType<WizardService['getAbout']>>);
    api.getClientHealthPlans.and.resolveTo({ clientUuid: 'test-clinic', acceptsHealthPlan: false, healthPlans: [] } as Awaited<ReturnType<WizardService['getClientHealthPlans']>>);
    api.saveAbout.and.resolveTo(); api.saveHealthPlans.and.resolveTo();
  });
  afterEach(() => sessionStorage.removeItem('wizard_step1_draft'));
  it('uses the API instead of stale drafts after completion and saves without navigating', async () => {
    sessionStorage.setItem('wizard_step1_draft', JSON.stringify({ clinicName: 'Old draft' }));
    const page = new WizardStep1AboutComponent(router, api, complete);
    await page.ngOnInit();
    expect(page.clinicName).toBe('API clinic');
    expect(page.configurationChanges.hasChanges()).toBeFalse();
    page.clinicName = 'New name';
    expect(page.configurationChanges.hasChanges()).toBeTrue();
    expect(await page.configurationChanges.save()).toBeTrue();
    expect(api.saveAbout.calls.mostRecent().args[0].clientName).toBe('New name');
    expect(page.configurationChanges.hasChanges()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('does not mark a partial save as fully persisted', async () => {
    const page = new WizardStep1AboutComponent(router, api, complete);
    await page.ngOnInit(); page.clinicName = 'Pending';
    api.saveHealthPlans.and.rejectWith(new Error('offline'));
    expect(await page.configurationChanges.save()).toBeFalse();
    expect(page.configurationChanges.hasChanges()).toBeTrue();
  });
  it('defers saving to the exit confirmation when Next is clicked after completion', async () => {
    const page = new WizardStep1AboutComponent(router, api, complete);
    await page.ngOnInit(); page.clinicName = 'Changed';
    await page.goNext();
    expect(api.saveAbout).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/wizard-step-2-specialty']);
  });
  it('does not treat specialty searches as edits, and detects a selection reverted to its original state', async () => {
    api.getSpecialtiesByTypeClients.and.resolveTo([{ id: '1', name: 'General', typeClientId: 1 }]);
    api.getClientSpecialties.and.resolveTo({ clientUuid: 'test-clinic', specialties: [] } as Awaited<ReturnType<WizardService['getClientSpecialties']>>);
    const page = new WizardStep2SpecialtyComponent(router, api, complete);
    await page.ngOnInit(); page.searchTerm = 'General';
    expect(page.configurationChanges.hasChanges()).toBeFalse();
    page.toggleSpecialty(page.availableSpecialties[0]);
    expect(page.configurationChanges.hasChanges()).toBeTrue();
    page.toggleSpecialty(page.availableSpecialties[0]);
    expect(page.configurationChanges.hasChanges()).toBeFalse();
    sessionStorage.removeItem('wizard_step2_specialties_draft');
  });
  it('persists removal of a saved exception before marking the schedule clean', async () => {
    api.getClientAvailability.and.resolveTo([{ id: 5, availabilityType: 'NON_WORKING_DAY', specificDate: '2026-10-15', dayOfWeek: null } as Awaited<ReturnType<WizardService['getClientAvailability']>>[number]]);
    api.deleteAvailability.and.resolveTo();
    const page = new WizardStep4ScheduleComponent(router, api, complete);
    await page.ngOnInit(); page.removeException(page.exceptions[0].id);
    expect(await page.configurationChanges.save()).toBeTrue();
    expect(api.deleteAvailability).toHaveBeenCalledWith(5);
    expect(page.configurationChanges.hasChanges()).toBeFalse();
  });
});
