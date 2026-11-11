import { AuthService } from '../../auth/auth.service';
import { Component, Input, Output, EventEmitter, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { WaitingConversationsService } from '../../whatsapp/waiting-conversations.service';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { PlanAccessService } from '../../pages/subscription/plan-access.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
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
          <img src="logo.png" alt="Atenclin" class="sidebar-logo-img" />
        </div>
        <span class="logo-text" *ngIf="!collapsed">Atenclin</span>
      </div>

      <!-- Menu Items -->
      <ul class="menu-list">
        <li *ngFor="let item of visibleMenuItems()">
          <a
            [routerLink]="item.route"
            [queryParams]="item.queryParams"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact: item.route === '/'}"
            class="menu-item"
            [pTooltip]="collapsed ? item.label : ''"
            tooltipPosition="right">
            <i [class]="item.icon"></i>
            <span class="menu-label" *ngIf="!collapsed">{{ item.label }}</span>
            <span *ngIf="item.route === '/conversas' && waiting.count() > 0" class="menu-badge" [class.dot]="collapsed"
              [attr.aria-label]="waiting.count() + ' aguardando a equipe'" [title]="waiting.count() + ' aguardando a equipe'">
              {{ collapsed ? '' : (waiting.count() > 99 ? '99+' : waiting.count()) }}</span>
          </a>
        </li>
      </ul>

      <!-- Teste grátis: dias restantes, ou aviso de teste encerrado. Atendentes não contratam, então não veem. -->
      <a *ngIf="trialBanner() as trial" routerLink="/subscription" class="trial-banner" [class.expired]="trial.expired"
        [class.last-day]="!trial.expired && trial.daysLeft <= 1"
        [pTooltip]="collapsed ? trial.title : ''" tooltipPosition="right" [attr.aria-label]="trial.title + '. ' + trial.action">
        <i class="pi" [class.pi-gift]="!trial.expired" [class.pi-hourglass]="trial.expired" aria-hidden="true"></i>
        <span class="trial-text" *ngIf="!collapsed">
          <strong>{{ trial.title }}</strong>
          <span>{{ trial.action }}</span>
        </span>
      </a>

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
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [
    { label: 'Início', icon: 'pi pi-home', route: '/' },
    { label: 'Conversas', icon: 'pi pi-comments', route: '/conversas' },
    //{ label: 'Novos contatos', icon: 'pi pi-users', route: '/contatos' },
    { label: 'Etapas do atendimento', icon: 'pi pi-th-large', route: '/etapas' },
    { label: 'Agenda', icon: 'pi pi-calendar', route: '/agenda' },
    { label: 'Acompanhamento automático', icon: 'pi pi-sparkles', route: '/ac' },
    { label: 'Tarefas', icon: 'pi pi-check-square', route: '/tarefas' },
    { label: 'Resultados', icon: 'pi pi-chart-bar', route: '/resultados' },
    //{ label: 'Equipe', icon: 'pi pi-cog', route: '/equipe' },
    { label: 'Configurações', icon: 'pi pi-sliders-h', route: '/wizard-step-9-review', queryParams: { source: 'menu' } },
    { label: 'Assinatura', icon: 'pi pi-credit-card', route: '/subscription' },
    { label: 'Ajuda', icon: 'pi pi-question-circle', route: '/ajuda' },
  ];

  private readonly auth = inject(AuthService);
  readonly waiting = inject(WaitingConversationsService);
  private readonly planAccess = inject(PlanAccessService);

  ngOnInit(): void {
    this.waiting.watch();
    if (!this.auth.isAttendant()) void this.planAccess.load();
  }
  ngOnDestroy(): void { this.waiting.unwatch(); }
  readonly visibleMenuItems = computed(() => this.auth.isAttendant()
    ? this.menuItems.filter(item => !['/agenda', '/tarefas', '/wizard-step-9-review', '/subscription'].includes(item.route))
    : this.menuItems);

  /** Recalculado a cada renderização, para o teste virar "encerrado" sem recarregar a página. */
  trialBanner(): { daysLeft: number; expired: boolean; title: string; action: string } | null {
    const end = this.planAccess.trialEndsAt();
    if (!end || this.auth.isAttendant()) return null;
    const msLeft = new Date(end).getTime() - Date.now();
    if (Number.isNaN(msLeft)) return null;
    if (msLeft <= 0) return { daysLeft: 0, expired: true, title: 'Teste grátis encerrado', action: 'Escolha um plano' };
    const daysLeft = Math.ceil(msLeft / 86_400_000);
    const title = daysLeft === 1 ? 'Último dia de teste' : `${daysLeft} dias de teste grátis`;
    return { daysLeft, expired: false, title, action: 'Assinar agora' };
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}
