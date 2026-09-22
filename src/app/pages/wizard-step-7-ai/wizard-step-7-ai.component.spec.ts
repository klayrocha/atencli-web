import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AiConfiguration, AiConfigurationService } from '../../ai/ai-configuration.service';
import { WizardStep7AiComponent } from './wizard-step-7-ai.component';

describe('Wizard AI configuration', () => {
  let component: WizardStep7AiComponent;
  let api: jasmine.SpyObj<AiConfigurationService>;
  let data: AiConfiguration;
  beforeEach(async () => {
    api = jasmine.createSpyObj('AiConfigurationService', ['getConfiguration', 'save', 'setEnabled']);
    component = new WizardStep7AiComponent(api, { currentProfile: () => ({ roles: ['ADMIN'] }) } as unknown as AuthService, jasmine.createSpyObj<Router>('Router', ['navigate']));
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
});
