import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WIZARD_STEPS_DEFAULT } from './wizard.models';
import { ONBOARDING_ROUTES, OnboardingProgressService } from './onboarding-progress.service';

@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="stepper" aria-label="Etapas da configuração">
      <div *ngFor="let step of steps; let last = last" class="step" [class.current]="step.id === currentStepId" [class.done]="isCompleted(step.id)">
        <a [routerLink]="isCompleted(step.id) ? routes[step.id - 1] : null"
          [attr.aria-disabled]="!isCompleted(step.id) ? 'true' : null"
          [attr.aria-current]="step.id === currentStepId ? 'step' : null"
          [attr.aria-label]="step.label + (isCompleted(step.id) ? ' — concluída, revisar' : ' — pendente')">
          <span class="circle"><i *ngIf="isCompleted(step.id)" class="pi pi-check" aria-hidden="true"></i><span *ngIf="!isCompleted(step.id)">{{ step.id }}</span></span>
          <span class="label">{{ step.label }}</span>
        </a>
        <span *ngIf="!last" class="line" aria-hidden="true"></span>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; }
    .stepper { display: flex; overflow-x: auto; padding: .5rem .75rem; margin-bottom: 2rem; }
    .step { flex: 1; min-width: 85px; position: relative; text-align: center; }
    a { display: flex; flex-direction: column; align-items: center; gap: .5rem; color: #64748b; text-decoration: none; position: relative; z-index: 1; border-radius: 8px; padding: 3px; }
    a[href]:hover { color: #4d7c0f; background: #f7fee7; }
    a:focus-visible { outline: 2px solid #65a30d; outline-offset: -2px; }
    .circle { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; font-weight: 700; }
    .label { font-size: .775rem; font-weight: 600; white-space: nowrap; }
    .line { position: absolute; top: 21px; left: 50%; width: 100%; height: 1.5px; background: #e2e8f0; }
    .done .circle, .done .line { background: #84cc16; color: white; }
    .current .circle { box-shadow: 0 0 0 3px #bef264; }
    .current .label { color: #1e293b; font-weight: 700; }
  `],
})
export class WizardStepperComponent {
  @Input() currentStepId = 1;
  readonly progress = inject(OnboardingProgressService);
  readonly steps = WIZARD_STEPS_DEFAULT;
  readonly routes = ONBOARDING_ROUTES;
  isCompleted(id: number): boolean { return id <= this.progress.completedSteps(); }
}
