import { inject, Injectable, signal } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { OnboardingProgressService } from '../pages/wizard-shared/onboarding-progress.service';
import { ConfigurationChanges } from '../pages/wizard-shared/configuration-changes';

export interface ConfigurationEditor { configurationChanges: ConfigurationChanges; }

@Injectable({ providedIn: 'root' })
export class ConfigurationExitService {
  readonly visible = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  private editor?: ConfigurationEditor;
  private resolve?: (allowed: boolean) => void;

  confirm(editor: ConfigurationEditor): Promise<boolean> {
    // Uma segunda tentativa de navegação não pode substituir a confirmação em andamento.
    if (this.visible()) return Promise.resolve(false);
    this.editor = editor;
    this.error.set('');
    this.visible.set(true);
    return new Promise(resolve => { this.resolve = resolve; });
  }
  cancel(): void { if (!this.saving()) this.finish(false); }
  async save(): Promise<void> {
    if (this.saving() || !this.editor) return;
    this.saving.set(true);
    this.error.set('');
    try {
      if (await this.editor.configurationChanges.save() && !this.editor.configurationChanges.hasChanges()) {
        this.finish(true);
      } else {
        this.error.set('Não foi possível salvar. Volte à tela para conferir os campos ou tente novamente.');
      }
    } catch {
      this.error.set('Não foi possível salvar as configurações. Tente novamente.');
    } finally { this.saving.set(false); }
  }
  private finish(allowed: boolean): void {
    const resolve = this.resolve;
    this.resolve = undefined;
    this.editor = undefined;
    this.visible.set(false);
    resolve?.(allowed);
  }
}

export const configurationExitGuard: CanDeactivateFn<ConfigurationEditor> = component => {
  if (!inject(OnboardingProgressService).isConfigurationComplete() || !component.configurationChanges.hasChanges()) return true;
  return inject(ConfigurationExitService).confirm(component);
};
