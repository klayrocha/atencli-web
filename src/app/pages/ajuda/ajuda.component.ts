import { Component } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-ajuda', standalone: true,
  template: `
    <main class="help-entry">
      <span>ATENCLIN · CENTRAL DE AJUDA</span>
      <h1>Encontre o próximo passo.</h1>
      <p>Guias de configuração, canais e atendimento para a rotina da sua clínica.</p>
      <a class="primary" [href]="helpUrl" target="_blank" rel="noopener noreferrer">Abrir central de ajuda ↗</a>
      <nav aria-label="Guias de ajuda">
        <a [href]="helpUrl + '/artigos/primeiros-passos/'" target="_blank" rel="noopener noreferrer">Primeiros passos ↗</a>
        <a [href]="helpUrl + '/artigos/whatsapp/'" target="_blank" rel="noopener noreferrer">Conectar WhatsApp ↗</a>
        <a [href]="helpUrl + '/artigos/aceitar-convite/'" target="_blank" rel="noopener noreferrer">Aceitar um convite ↗</a>
      </nav>
      <small>Os guias abrem em uma nova aba.</small>
    </main>
  `,
  styles: [`
    :host { display: block; }.help-entry { max-width: 820px; margin: 8vh auto; padding: 40px; border-radius: 20px; background: #f2f7e8; color: #2e402e; }
    span { font-size: 11px; letter-spacing: 2px; } h1 { font-size: 34px; margin: 18px 0; } p { color: #6d7c65; line-height: 1.7; }
    a { color: #426b3b; text-decoration: none; } a:focus-visible { outline: 2px solid #648544; outline-offset: 4px; }.primary { display: inline-block; margin: 18px 0; padding: 14px 20px; border-radius: 10px; background: #d5e882; color: #30431d; }
    nav { display: flex; flex-wrap: wrap; gap: 20px; margin: 24px 0; font-size: 14px; } small { color: #68775f; } @media(max-width:600px) { .help-entry { margin: 20px; padding: 24px; } h1 { font-size: 28px; } }
  `]
})
export class AjudaComponent { readonly helpUrl = environment.helpUrl; }
