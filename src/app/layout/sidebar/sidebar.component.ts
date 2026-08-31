import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, TooltipModule],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed">
      <!-- Logo atenclin -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="22" stroke="#84cc16" stroke-width="4" stroke-dasharray="95 25"/>
            <circle cx="26" cy="26" r="13" stroke="#65a30d" stroke-width="3" stroke-dasharray="52 14"/>
            <circle cx="26" cy="26" r="5" fill="#84cc16"/>
          </svg>
        </div>
        <span class="logo-text" *ngIf="!collapsed">atenclin</span>
      </div>

      <!-- Menu Items -->
      <ul class="menu-list">
        <li *ngFor="let item of menuItems">
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact: item.route === '/'}"
            class="menu-item"
            [pTooltip]="collapsed ? item.label : ''"
            tooltipPosition="right">
            <i [class]="item.icon"></i>
            <span class="menu-label" *ngIf="!collapsed">{{ item.label }}</span>
          </a>
        </li>
      </ul>

      <!-- Bottom actions -->
      <div class="sidebar-footer">
        <button class="collapse-btn" (click)="toggleCollapse()">
          <i class="pi" [class.pi-chevron-left]="!collapsed" [class.pi-chevron-right]="collapsed"></i>
          <span *ngIf="!collapsed">Recolher menu</span>
        </button>
      </div>
    </nav>
  `,
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [
    { label: 'Início', icon: 'pi pi-home', route: '/' },
    { label: 'Conversas', icon: 'pi pi-comments', route: '/conversas' },
    { label: 'Novos contatos', icon: 'pi pi-users', route: '/contatos' },
    { label: 'Etapas do atendimento', icon: 'pi pi-th-large', route: '/etapas' },
    { label: 'Agenda', icon: 'pi pi-calendar', route: '/agenda' },
    { label: 'Tarefas', icon: 'pi pi-check-square', route: '/tarefas' },
    { label: 'Resultados', icon: 'pi pi-chart-bar', route: '/resultados' },
    { label: 'Inteligência artificial', icon: 'pi pi-sparkles', route: '/ia' },
    { label: 'Equipe', icon: 'pi pi-cog', route: '/equipe' },
    { label: 'Configurações', icon: 'pi pi-sliders-h', route: '/configuracoes' },
    { label: 'Ajuda', icon: 'pi pi-question-circle', route: '/ajuda' },
  ];

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}
