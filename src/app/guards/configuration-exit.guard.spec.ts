import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfigurationExitService, configurationExitGuard } from './configuration-exit.guard';
import { ConfigurationChanges } from '../pages/wizard-shared/configuration-changes';
import { OnboardingProgressService } from '../pages/wizard-shared/onboarding-progress.service';

describe('Pending configuration navigation', () => {
  let modal: ConfigurationExitService;
  let complete: boolean;
  let value: string;
  let save: jasmine.Spy;
  let editor: { configurationChanges: ConfigurationChanges };
  beforeEach(() => {
    complete = true; value = 'API value';
    save = jasmine.createSpy('save').and.callFake(async () => { editor.configurationChanges.markSaved(); return true; });
    editor = { configurationChanges: new ConfigurationChanges(() => value, save) };
    editor.configurationChanges.markSaved();
    TestBed.configureTestingModule({ providers: [
      { provide: OnboardingProgressService, useValue: { isConfigurationComplete: () => complete } },
    ] });
    modal = TestBed.inject(ConfigurationExitService);
  });
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  function leave() { return TestBed.runInInjectionContext(() => configurationExitGuard(editor, route, state, state)); }
  it('does not interrupt initial onboarding or unchanged/reverted forms', () => {
    expect(leave()).toBeTrue();
    value = 'changed'; complete = false;
    expect(leave()).toBeTrue();
    complete = true; value = 'API value';
    expect(leave()).toBeTrue();
    expect(save).not.toHaveBeenCalled();
  });
  it('cancels navigation without saving or discarding edits', async () => {
    value = 'changed'; const navigation = leave();
    expect(modal.visible()).toBeTrue();
    modal.cancel();
    expect(await navigation).toBeFalse();
    expect(editor.configurationChanges.hasChanges()).toBeTrue();
    expect(save).not.toHaveBeenCalled();
  });
  it('waits for API success and ignores duplicate confirmation clicks', async () => {
    value = 'changed'; const navigation = leave();
    let resolve!: () => void;
    save.and.callFake(() => new Promise<boolean>(done => { resolve = () => { editor.configurationChanges.markSaved(); done(true); }; }));
    const pending = modal.save();
    await modal.save();
    expect(modal.visible()).toBeTrue();
    expect(save).toHaveBeenCalledTimes(1);
    resolve(); await pending;
    expect(await navigation).toBeTrue();
  });
  it('retains the form on API failure and allows a retry', async () => {
    value = 'changed'; const navigation = leave();
    save.and.rejectWith(new Error('offline'));
    await modal.save();
    expect(modal.visible()).toBeTrue();
    expect(modal.error()).toBeTruthy();
    expect(editor.configurationChanges.hasChanges()).toBeTrue();
    save.and.callFake(async () => { editor.configurationChanges.markSaved(); return true; });
    await modal.save();
    expect(await navigation).toBeTrue();
  });
  it('blocks departure when validation fails', async () => {
    value = 'changed'; const navigation = leave();
    save.and.resolveTo(false);
    await modal.save();
    expect(modal.visible()).toBeTrue();
    modal.cancel(); expect(await navigation).toBeFalse();
  });
});
