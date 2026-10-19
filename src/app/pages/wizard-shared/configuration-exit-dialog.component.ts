import { Component, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfigurationExitService } from '../../guards/configuration-exit.guard';

@Component({
  selector: 'app-configuration-exit-dialog', standalone: true,
  imports: [DialogModule, ButtonModule],
  template: `
    <p-dialog header="Alterações de configuração" [visible]="confirmation.visible()"
      [modal]="true" [closable]="false" [closeOnEscape]="false" [draggable]="false"
      [style]="{width: 'min(480px, 92vw)'}">
      <p>Foram identificadas alterações de configurações. Clique em OK para confirmar e salvar antes de sair.</p>
      <p role="alert" style="color: #b91c1c">{{ confirmation.error() }}</p>
      <ng-template pTemplate="footer">
        <p-button label="Continuar editando" severity="secondary" [disabled]="confirmation.saving()" (onClick)="confirmation.cancel()" />
        <p-button label="OK, salvar" [loading]="confirmation.saving()" [disabled]="confirmation.saving()" (onClick)="confirmation.save()" />
      </ng-template>
    </p-dialog>
  `,
})
export class ConfigurationExitDialogComponent {
  readonly confirmation = inject(ConfigurationExitService);
}
