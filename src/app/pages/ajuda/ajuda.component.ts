import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-ajuda',
  standalone: true,
  template: `
    <iframe [src]="documentationUrl" title="Central de ajuda Atenclin"></iframe>
  `,
  styles: [`
    :host { display: block; }
    iframe { display: block; width: 100%; height: calc(100dvh - 140px); min-height: 480px; border: 0; border-radius: 16px; background: #fff; }
  `],
})
export class AjudaComponent {
  // Caminho fixo do build, relativo ao base href. Não recebe URLs do usuário.
  readonly documentationUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    new URL('ajuda-docs/', inject(DOCUMENT).baseURI).href,
  );
}
