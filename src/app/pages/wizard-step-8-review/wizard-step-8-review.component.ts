import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { searchReviewSteps } from './review-search';
import { Router, RouterLink } from '@angular/router';
import { WizardSummaryComponent } from '../wizard-shared/wizard-summary/wizard-summary.component';
import { WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';

@Component({
  selector: 'app-wizard-step-8-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WizardSummaryComponent],
  template: `
    <div class="wizard-container">
    <main class="review-page">
      <header><span class="step-label">Passo 8 de 8</span><h1>Parabéns, você concluiu a configuração!</h1><p>Um novo começo para o atendimento da sua clínica: mais organização para a equipe e mais cuidado em cada conversa.</p></header>
      <div class="horizontal-stepper" role="list" aria-label="Etapas da configuração">
        <div *ngFor="let step of steps; let last = last" class="step-item" role="listitem" [class.active]="step.id === 8" [class.completed]="step.id < 8" [attr.aria-current]="step.id === 8 ? 'step' : null">
          <div class="step-circle"><i *ngIf="step.id < 8" class="pi pi-check" aria-hidden="true"></i><span *ngIf="step.id === 8">8</span></div>
          <span class="step-label">{{ step.label }}</span>
          <div *ngIf="!last" class="step-line completed" aria-hidden="true"></div>
        </div>
      </div>
      <section class="completion-card" aria-labelledby="next-title">
        <div class="completion-icon"><i class="pi pi-check" aria-hidden="true"></i></div>
        <h2 id="next-title">Tudo pronto para o próximo passo</h2>
        <p>Acesse sua área de atendimento para acompanhar as conversas e organizar a rotina da equipe. Veja o que você pode fazer agora:</p>
        <ul class="next-actions">
          <li><i class="pi pi-comments" aria-hidden="true"></i><div><strong>Acompanhar suas conversas</strong><p>Consulte os atendimentos e dê continuidade ao contato com seus pacientes.</p></div></li>
          <li><i class="pi pi-users" aria-hidden="true"></i><div><strong>Organizar o trabalho da equipe</strong><p>Acompanhe as demandas e mantenha todos alinhados sobre os próximos passos de cada atendimento.</p></div></li>
          <li><i class="pi pi-sparkles" aria-hidden="true"></i><div><strong>Contar com o apoio da IA</strong><p>Quando ativada, a IA segue as regras que você definiu para apoiar o atendimento da clínica.</p></div></li>
        </ul>
        <a class="primary" routerLink="/conversas"><i class="pi pi-bolt" aria-hidden="true"></i> Iniciar atendimento <i class="pi pi-arrow-right" aria-hidden="true"></i></a>
      </section>
      <p class="review-invitation">Caso deseje, você poderá revisar as configurações já realizadas.</p>
      <section class="review-panel" aria-label="Revisão das configurações">
        <button type="button" class="review-toggle" [attr.aria-expanded]="reviewExpanded" aria-controls="review-steps" (click)="reviewExpanded = !reviewExpanded">
          <i class="pi pi-sliders-h" aria-hidden="true"></i>
          <span><strong>Revisar configurações</strong><small>Consulte ou ajuste as informações de cada etapa.</small></span>
          <i class="pi toggle-chevron" [class.pi-chevron-down]="!reviewExpanded" [class.pi-chevron-up]="reviewExpanded" aria-hidden="true"></i>
        </button>
        <div id="review-steps" [hidden]="!reviewExpanded" class="review-content">
          <label class="search-label" for="configuration-search">O que você deseja configurar?</label>
          <div class="search-field">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input id="configuration-search" #searchInput type="search" [(ngModel)]="searchQuery" placeholder="Ex.: preços, convênios, horário da IA" aria-describedby="search-help" autocomplete="off">
            <button *ngIf="searchQuery" type="button" (click)="searchQuery = ''; searchInput.focus()" aria-label="Limpar busca"><i class="pi pi-times" aria-hidden="true"></i></button>
          </div>
          <p id="search-help" class="search-help">Busque pelo assunto ou descreva o ajuste que deseja fazer.</p>
          <p class="search-count" role="status" aria-live="polite">{{ filteredSteps.length }} {{ filteredSteps.length === 1 ? 'etapa encontrada' : 'etapas encontradas' }}</p>
          <nav aria-label="Etapas para revisar">
          <a *ngFor="let step of filteredSteps" [routerLink]="step.route">
            <i [class]="step.icon" aria-hidden="true"></i>
            <span><strong>{{ step.label }}</strong><small>{{ step.summary }}</small></span>
            <span class="edit-label">Revisar <i class="pi pi-chevron-right" aria-hidden="true"></i></span>
          </a>
          </nav>
          <div *ngIf="!filteredSteps.length" class="search-empty"><i class="pi pi-search" aria-hidden="true"></i><strong>Nenhuma configuração encontrada</strong><p>Tente outras palavras, como “equipe”, “WhatsApp” ou “preços”.</p></div>
        </div>
      </section>
      <footer><a class="back" routerLink="/ia"><i class="pi pi-chevron-left" aria-hidden="true"></i> Voltar para IA</a></footer>
    </main>
    <app-wizard-summary [steps]="steps" [currentStepId]="8" (activate)="startService()"></app-wizard-summary>
    </div>
  `,
  styles: [`
.horizontal-stepper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 0.5rem 0.75rem;
  overflow-x: auto;
}

.step-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  position: relative;
  text-align: center;

  .step-circle {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    z-index: 2;
    margin-bottom: 0.5rem;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .step-label { color: #64748b; font-size: 0.775rem; font-weight: 600; white-space: nowrap; }

  .step-line {
    position: absolute;
    top: 18px;
    left: 50%;
    width: 100%;
    height: 1.5px;
    z-index: 1;
    background: #e2e8f0;

    &.completed { background: #84cc16; }
  }

  &.completed .step-circle { background: #84cc16; color: #fff; }

  &.active {
    .step-circle {
      border: 2px solid #bef264;
      background: #d9f99d;
      color: #3f6212;
      box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.15);
    }
    .step-label { color: #1e293b; font-weight: 700; }
  }
}



    .step-item { min-width: 75px; }

    .wizard-container { display: flex; align-items: flex-start; gap: 2rem; max-width: 1400px; margin: 0 auto; }
    .review-page { flex: 1; min-width: 0; color: #1e293b; }
    @media(max-width: 1100px) { .wizard-container { flex-direction: column; } .review-page, app-wizard-summary { width: 100%; } }
    header { padding: 1.5rem 2rem; border: 1px solid #e8f5e9; border-radius: 16px; background: linear-gradient(135deg,#f0fdf4,#fefce8 52%,#f0f9ff); margin-bottom: 2rem; }
    .step-label { font-size: .8rem; font-weight: 700; color: #4d7c0f; }
    h1 { margin: .5rem 0; font-size: 1.7rem; } p { color: #64748b; margin: 0; line-height: 1.5; }
    nav { display: grid; gap: .8rem; } nav a { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; border: 1px solid #e2e8f0; border-radius: 12px; background: white; color: inherit; text-decoration: none; }
    nav a:hover { border-color: #84cc16; background: #f7fee7; } nav a > i { color: #4d7c0f; font-size: 1.2rem; }
    strong, small { display: block; } small { color: #64748b; margin-top: .25rem; line-height: 1.5; } .edit-label { margin-left: auto; font-size: .8rem; white-space: nowrap; color: #4d7c0f; }
    footer { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; } footer a { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .8rem 1.15rem; border-radius: 8px; font-weight: 700; font-size: .85rem; text-decoration: none; }
    .back { border: 1px solid #cbd5e1; background: white; color: #475569; } .primary { min-height: 52px; background: #84cc16; color: #1a2e05; box-shadow: 0 6px 18px rgba(101,163,13,.25); border: 1px solid #65a30d; font-size: 1rem; } .primary:hover { background: #a3e635; box-shadow: 0 8px 22px rgba(101,163,13,.32); }
    .completion-card { padding: 2rem; border: 1px solid #d9e9c6; border-radius: 16px; background: #fff; }
    .completion-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: #ecfccb; color: #4d7c0f; font-size: 1.5rem; margin-bottom: 1rem; }
    h2 { margin: 0 0 .65rem; font-size: 1.35rem; }
    .next-actions { list-style: none; padding: 0; margin: 1.5rem 0; display: grid; gap: 1.25rem; }
    .next-actions li { display: flex; align-items: flex-start; gap: .85rem; }
    .next-actions li > i { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 9px; background: #f7fee7; color: #4d7c0f; }
    .next-actions strong { font-size: .9rem; margin-bottom: .25rem; }
    .next-actions p { font-size: .85rem; }
    .completion-card .primary { box-sizing: border-box; display: inline-flex; justify-content: center; align-items: center; gap: .65rem; padding: .9rem 1.5rem; border-radius: 10px; font-weight: 800; text-decoration: none; }
    .review-invitation { margin: 1.5rem 0 1rem; font-size: .9rem; }
    .review-panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .review-toggle { display: flex; align-items: center; gap: .85rem; width: 100%; padding: 1.25rem; border: 0; background: white; color: #334155; font: inherit; text-align: left; cursor: pointer; }
    .review-toggle:hover { background: #f8fafc; }
    .review-toggle > i { color: #4d7c0f; }
    .review-toggle strong { font-size: .95rem; }
    .toggle-chevron { margin-left: auto; }
    .review-content { padding: 1.25rem; border-top: 1px solid #e2e8f0; }
    .search-label { display: block; font-size: .9rem; font-weight: 700; margin-bottom: .65rem; }
    .search-field { display: flex; align-items: center; gap: .65rem; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 .85rem; color: #64748b; background: white; }
    .search-field:focus-within { outline: 2px solid #84cc16; outline-offset: 2px; }
    .search-field input { min-width: 0; flex: 1; width: 100%; padding: .85rem 0; border: 0; outline: 0; background: transparent; color: #334155; font: inherit; font-size: .9rem; }
    .search-field button { display: grid; place-items: center; min-width: 32px; min-height: 32px; border: 0; border-radius: 4px; background: #f1f5f9; color: #475569; cursor: pointer; }
    .search-help { font-size: .78rem; margin-top: .5rem; }
    .search-count { font-size: .8rem; margin: 1rem 0 .75rem; }
    .search-empty { padding: 1.5rem; text-align: center; background: #f8fafc; border-radius: 8px; }
    .search-empty > i { margin-bottom: .75rem; color: #64748b; }
    .search-empty strong { margin-bottom: .4rem; }
    .search-empty p { font-size: .85rem; }
    .review-panel nav[hidden] { display: none; }
    @media(max-width: 600px) { .completion-card { padding: 1.25rem; } .completion-card .primary { width: 100%; } .review-content { padding: .75rem; } }
    a:focus-visible, button:focus-visible { outline: 2px solid #65a30d; outline-offset: 3px; }
    @media(max-width: 600px) { header { padding: 1.25rem; } footer { flex-direction: column-reverse; } .edit-label { font-size: 0; } .edit-label i { font-size: .85rem; } }
  `],
})
export class WizardStep8ReviewComponent {
  reviewExpanded = false;
  readonly steps = WIZARD_STEPS_DEFAULT.map(step => ({ ...step, completed: true, current: step.id === 8 }));
  constructor(private router: Router) {}
  startService() { void this.router.navigate(['/conversas']); }
  searchQuery = '';
  get filteredSteps() { return searchReviewSteps(this.searchQuery); }
}
