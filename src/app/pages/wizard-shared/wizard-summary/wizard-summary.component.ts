import { Router, RouterLink } from '@angular/router';
import { ONBOARDING_ROUTES, OnboardingProgressService } from '../onboarding-progress.service';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardStep } from '../wizard.models';

@Component({
  selector: 'app-wizard-summary',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wizard-summary.component.html',
  styleUrls: ['./wizard-summary.component.scss'],
})
export class WizardSummaryComponent {
  readonly progress = inject(OnboardingProgressService);
  private readonly router = inject(Router);
  readonly routes = ONBOARDING_ROUTES;
  isCompleted(id: number): boolean { return id <= this.progress.completedSteps(); }
  @Input() steps: WizardStep[] = [];
  @Input() currentStepId = 1;
  @Output() activate = new EventEmitter<void>();

  get completedCount(): number {
    return this.steps.filter(s => this.isCompleted(s.id)).length;
  }

  get totalCount(): number {
    return this.steps.length || 8;
  }

  get progressPercent(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100 * 10) / 10;
  }

  get strokeDashOffset(): number {
    const circumference = 175.93; // 2 * PI * 28
    const progress = this.completedCount / this.totalCount;
    return circumference - (circumference * progress);
  }

  get allStepsCompleted(): boolean {
    return this.steps.length > 0 && this.steps.every(s => this.isCompleted(s.id));
  }

  onActivate(): void {
    if (this.allStepsCompleted) {
      void this.router.navigate(['/conversas']);
    }
  }
}
