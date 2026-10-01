import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AiConfiguration, AiConfigurationService } from '../../ai/ai-configuration.service';
import { WizardStep7AiComponent } from './wizard-step-7-ai.component';

describe('Wizard AI configuration', () => {
  let component: WizardStep7AiComponent;
  let api: jasmine.SpyObj<AiConfigurationService>;
  let data: AiConfiguration;
  let router: jasmine.SpyObj<Router>;
  beforeEach(async () => {
    api = jasmine.createSpyObj('AiConfigurationService', ['getConfiguration', 'save', 'setEnabled']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    component = new WizardStep7AiComponent(api, { currentProfile: () => ({ roles: ['ADMIN'] }) } as unknown as AuthService, router);
    data = { ...component.model, enabled: false, usingDefaults: true, activeDays: [], serviceStartTime: null, serviceEndTime: null };
    api.getConfiguration.and.resolveTo(data);
    api.save.and.callFake(async payload => ({ ...payload, enabled: false, usingDefaults: false }));
    await component.load();
  });
  it('clears custom scheduling fields and preserves mandatory triggers when saving clinic hours', async () => {
    component.model.activeDays = [1, 2];
    component.model.handoffTriggers = [];
    await component.save();
    const payload = api.save.calls.mostRecent().args[0];
    expect(payload.activeDays).toEqual([]);
    expect(payload.serviceStartTime).toBeNull();
    expect(payload.serviceEndTime).toBeNull();
    expect(payload.handoffTriggers).toEqual(component.requiredTriggers);
    expect(api.setEnabled).not.toHaveBeenCalled();
  });
  it('starts new AI rules in limited automatic mode', () => {
    expect(component.model.mode).toBe('LIMITED_AUTOMATIC');
  });
  it('uses limited automatic mode when backend returns default assistant rules', async () => {
    api.getConfiguration.and.resolveTo({ ...data, mode: 'ASSISTANT', usingDefaults: true });
    await component.load();
    expect(component.model.mode).toBe('LIMITED_AUTOMATIC');
  });
  it('normalizes saved assistant rules to limited automatic mode in this wizard', async () => {
    api.getConfiguration.and.resolveTo({ ...data, mode: 'ASSISTANT', usingDefaults: false });
    await component.load();
    await component.save();
    const payload = api.save.calls.mostRecent().args[0];
    expect(component.model.mode).toBe('LIMITED_AUTOMATIC');
    expect(payload.mode).toBe('LIMITED_AUTOMATIC');
  });
  it('rejects empty days and reversed custom times before saving', async () => {
    component.model.schedulePolicy = 'CUSTOM_SCHEDULE';
    await component.save();
    expect(api.save).not.toHaveBeenCalled();
    component.model.activeDays = [1];
    component.model.serviceStartTime = '18:00';
    component.model.serviceEndTime = '08:00';
    await component.save();
    expect(api.save).not.toHaveBeenCalled();
    component.model.serviceEndTime = '19:00';
    await component.save();
    expect(api.save).toHaveBeenCalledTimes(1);
  });
  it('blocks activation with unsaved edits but allows pausing without losing them', async () => {
    component.model.tone = 'Tom ainda não salvo';
    component.changed();
    await component.toggleStatus();
    expect(api.setEnabled).not.toHaveBeenCalled();
    component.enabled = true;
    api.setEnabled.and.resolveTo(data);
    await component.toggleStatus();
    expect(api.setEnabled).toHaveBeenCalledOnceWith(false);
    expect(component.model.tone).toBe('Tom ainda não salvo');
    expect(component.dirty).toBeTrue();
  });
  it('retains edits and paused status when saving fails', async () => {
    api.save.and.rejectWith(new Error('offline'));
    component.model.tone = 'Novo tom';
    component.changed();
    await component.save();
    expect(component.model.tone).toBe('Novo tom');
    expect(component.dirty).toBeTrue();
    expect(component.enabled).toBeFalse();
    expect(component.error).toBeTruthy();
    expect(component.saving).toBeFalse();
  });
  it('saves defaults before navigating to review even without edits', async () => {
    await component.goToReview();
    expect(api.save).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/wizard-step-8-review']);
  });
  it('validates on review and stays on the form for invalid input', async () => {
    component.model.tone = '   ';
    await component.goToReview();
    expect(api.save).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.error).toContain('tom de voz');
  });
  it('stays on the form if saving from review fails', async () => {
    api.save.and.rejectWith(new Error('offline'));
    await component.goToReview();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.error).toBeTruthy();
  });
  it('waits for persistence and ignores repeated review clicks while saving', async () => {
    let finish!: (value: AiConfiguration) => void;
    api.save.and.returnValue(new Promise(resolve => { finish = resolve; }));
    const review = component.goToReview();
    await component.goToReview();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(api.save).toHaveBeenCalledTimes(1);
    finish(data);
    await review;
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
});
