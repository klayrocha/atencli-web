import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfigurationExitService } from '../../guards/configuration-exit.guard';

@Component({
  selector: 'app-configuration-exit-dialog', standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog header="Alterações de configuração" [visible]="confirmation.visible()"
      [modal]="true" [closable]="false" [closeOnEscape]="false" [draggable]="false"
      [style]="{width: 'min(480px, 92vw)'}">
      <p>Você alterou as configurações. Salve antes de sair ou descarte as alterações para manter os dados salvos anteriormente.</p>
      <div *ngIf="confirmation.error()" class="validation-alert" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <p>{{ confirmation.error() }}</p>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Descartar e sair" severity="danger" [text]="true" [disabled]="confirmation.saving()" (onClick)="confirmation.discard()" />
        <p-button label="Continuar editando" severity="secondary" [disabled]="confirmation.saving()" (onClick)="confirmation.cancel()" />
        <p-button label="OK, salvar" [loading]="confirmation.saving()" [disabled]="confirmation.saving()" (onClick)="confirmation.save()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .validation-alert { display: flex; align-items: flex-start; gap: .75rem; padding: 1rem; margin-top: 1rem; border: 1px solid #fecaca; border-radius: 12px; background: #fef2f2; color: #991b1b; }
    .validation-alert i { margin-top: .2rem; flex-shrink: 0; }
    .validation-alert p { margin: 0; line-height: 1.5; }
  `],
})
export class ConfigurationExitDialogComponent {
  readonly confirmation = inject(ConfigurationExitService);
}
