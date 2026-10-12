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
export class LayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private helpActive = false;
  sidebarCollapsed = false;

  ngOnInit(): void {
    this.applyMobileSidebarState();
    this.applyHelpSidebarState();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.applyHelpSidebarState());
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

  @HostListener('window:resize')
  onWindowResize(): void {
    this.applyMobileSidebarState();
  }

  private applyMobileSidebarState(): void {
    if (window.innerWidth <= 760) {
      this.sidebarCollapsed = true;
    }
  }
}
