import { Component, HostListener, OnInit } from '@angular/core';
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
export class LayoutComponent implements OnInit {
  sidebarCollapsed = false;

  ngOnInit(): void {
    this.applyMobileSidebarState();
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
