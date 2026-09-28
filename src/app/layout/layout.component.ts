import { OnboardingProgressService } from '../pages/wizard-shared/onboarding-progress.service';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="layout-wrapper">
      <app-sidebar [(collapsed)]="sidebarCollapsed"></app-sidebar>
      <div class="layout-main">
        <app-topbar></app-topbar>
        <main class="layout-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {
  private readonly onboarding = inject(OnboardingProgressService);
  sidebarCollapsed = false;
}
