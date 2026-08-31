import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/auth.service';
import { UserPanelComponent } from '../user-panel/user-panel.component';

interface Clinic {
  id: string;
  name: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, AvatarModule, BadgeModule, TooltipModule, UserPanelComponent],
  template: `
    <!-- Drawer lateral de perfil -->
    <app-user-panel *ngIf="userPanelOpen" (close)="userPanelOpen = false"></app-user-panel>

    <header class="topbar">

      <!-- Left: clinic selector dropdown -->
      <div class="topbar-left">
        <div class="clinic-selector" (click)="toggleClinicMenu(); $event.stopPropagation()" [class.open]="clinicMenuOpen">
          <div class="clinic-dot"></div>
          <span class="clinic-name">{{ selectedClinic.name }}</span>
          <i class="pi pi-chevron-down"></i>

          <div class="clinic-dropdown" *ngIf="clinicMenuOpen" (click)="$event.stopPropagation()">
            <div class="clinic-dropdown-label">Estabelecimentos</div>
            <button
              *ngFor="let clinic of clinics"
              class="clinic-dropdown-item"
              [class.active]="clinic.id === selectedClinic.id"
              (click)="selectClinic(clinic)">
              <div class="clinic-item-dot" [class.active]="clinic.id === selectedClinic.id"></div>
              <span>{{ clinic.name }}</span>
              <i class="pi pi-check" *ngIf="clinic.id === selectedClinic.id"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Center: date -->
      <div class="topbar-center">
        <div class="date-picker">
          <i class="pi pi-calendar"></i>
          <span>{{ todayLabel }}</span>
          <i class="pi pi-chevron-down"></i>
        </div>
      </div>

      <!-- Right: search, notifications, user -->
      <div class="topbar-right">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <span class="search-text">Buscar</span>
          <kbd>⌘ K</kbd>
        </div>

        <button class="icon-btn" pTooltip="Notificações" tooltipPosition="bottom">
          <i class="pi pi-bell"></i>
          <span class="notif-badge">3</span>
        </button>

        <div class="user-menu" (click)="toggleUserMenu(); $event.stopPropagation()" [class.open]="userMenuOpen">
          <p-avatar
            [label]="userInitials()"
            shape="circle"
            [style]="{'background-color': '#84cc16', 'color': '#fff', 'font-weight': '700', 'font-size': '0.8rem'}">
          </p-avatar>
          <span class="user-name">{{ userName() }}</span>
          <i class="pi pi-chevron-down"></i>

          <!-- Dropdown do usuário -->
          <div class="user-dropdown" *ngIf="userMenuOpen" (click)="$event.stopPropagation()">
            <div class="user-dropdown-header">
              <p-avatar
                [label]="userInitials()"
                shape="circle"
                size="large"
                [style]="{'background-color': '#84cc16', 'color': '#fff', 'font-weight': '700'}">
              </p-avatar>
              <div>
                <div class="user-dropdown-name">{{ userName() }}</div>
                <div class="user-dropdown-email">{{ userEmail() }}</div>
              </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item" (click)="openUserPanel()">
              <i class="pi pi-user"></i>
              Minha conta
            </button>
            <button class="user-dropdown-item user-dropdown-item--danger" (click)="logout()">
              <i class="pi pi-sign-out"></i>
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./topbar.component.scss'],
  host: {
    '(document:click)': 'onDocumentClick()'
  }
})
export class TopbarComponent {

  userMenuOpen   = false;
  clinicMenuOpen = false;
  userPanelOpen  = false;

  clinics: Clinic[] = [
    { id: 'harmonia', name: 'Clínica Harmonia' },
    { id: 'jardim',   name: 'Clínica Jardim'   },
  ];
  selectedClinic: Clinic = this.clinics[0];

  private auth = inject(AuthService);

  readonly userName  = computed(() =>
    this.auth.currentProfile()?.fullName ?? this.auth.currentUser()?.name ?? 'Usuário'
  );
  readonly userEmail = computed(() =>
    this.auth.currentProfile()?.email ?? this.auth.currentUser()?.email ?? ''
  );
  readonly userInitials = computed(() => {
    const name = this.auth.currentProfile()?.fullName ?? this.auth.currentUser()?.name ?? 'U';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  });

  get todayLabel(): string {
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    return `Hoje, ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
  }

  toggleClinicMenu(): void {
    this.clinicMenuOpen = !this.clinicMenuOpen;
    this.userMenuOpen = false;
  }

  selectClinic(clinic: Clinic): void {
    this.selectedClinic = clinic;
    this.clinicMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    this.clinicMenuOpen = false;
  }

  openUserPanel(): void {
    this.userMenuOpen = false;
    this.userPanelOpen = true;
  }

  onDocumentClick(): void {
    this.userMenuOpen   = false;
    this.clinicMenuOpen = false;
  }

  logout(): void {
    this.userMenuOpen = false;
    this.auth.logout();
  }
}
