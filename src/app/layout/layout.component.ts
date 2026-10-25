import { ConfigurationEditor } from '../guards/configuration-exit.guard';
import { OnboardingProgressService } from '../pages/wizard-shared/onboarding-progress.service';
import { ConfigurationExitDialogComponent } from '../pages/wizard-shared/configuration-exit-dialog.component';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [ConfigurationExitDialogComponent, CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <app-configuration-exit-dialog />
    <div class="layout-wrapper" [class.mobile-menu-open]="mobileMenuOpen">
      <button *ngIf="mobileMenuOpen" class="mobile-menu-backdrop" (click)="mobileMenuOpen = false" aria-label="Fechar menu"></button>
      <app-sidebar id="main-navigation" [collapsed]="isMobile ? false : sidebarCollapsed" (collapsedChange)="sidebarCollapsed = $event"></app-sidebar>
      <div class="layout-main">
        <app-topbar [menuOpen]="mobileMenuOpen" (menuToggle)="mobileMenuOpen = !mobileMenuOpen"></app-topbar>
        <main class="layout-content">
          <router-outlet (activate)="activePage = $event"></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private helpActive = false;
  sidebarCollapsed = false;
  isMobile = window.innerWidth <= 760;
  mobileMenuOpen = false;
  activePage?: Partial<ConfigurationEditor>;
  private readonly onboarding = inject(OnboardingProgressService);

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.onboarding.isConfigurationComplete() && this.activePage?.configurationChanges?.hasChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  ngOnInit(): void {
    this.applyMobileSidebarState();
    this.applyHelpSidebarState();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.mobileMenuOpen = false;
      this.applyHelpSidebarState();
    });
  }

  private applyHelpSidebarState(): void {
    const helpActive = this.router.isActive('/ajuda', {
      paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored',
    });
    if (helpActive && !this.helpActive) {
      this.sidebarCollapsed = true;
    }
    this.helpActive = helpActive;
  }

  @HostListener('document:keydown.escape')
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.applyMobileSidebarState();
  }

  private applyMobileSidebarState(): void {
    const mobile = window.innerWidth <= 760;
    if (mobile !== this.isMobile) this.mobileMenuOpen = false;
    this.isMobile = mobile;
  }
}
