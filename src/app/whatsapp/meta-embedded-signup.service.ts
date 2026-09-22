import { Injectable } from '@angular/core';
import { CompleteSignup, SignupConfig } from './whatsapp.service';

interface FacebookSdk {
  init(options: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void;
  login(callback: (response: { authResponse?: { code?: string } }) => void, options: {
    config_id: string; response_type: string; override_default_response_type: boolean;
    extras: { setup: Record<string, never>; sessionInfoVersion: string };
  }): void;
}
declare global { interface Window { FB?: FacebookSdk; } }

@Injectable({ providedIn: 'root' })
export class MetaEmbeddedSignupService {
  private loading?: Promise<void>;
  private cancelActive?: () => void;

  async prepare(config: SignupConfig): Promise<void> {
    if (!config.appId || !config.configurationId || !config.graphApiVersion) {
      throw new Error('Configuração da Meta indisponível. Tente novamente mais tarde.');
    }
    if (!window.FB) {
      this.loading ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'atenclin-facebook-sdk';
        script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
        script.async = true;
        const fail = () => {
          window.clearTimeout(timer);
          script.remove();
          reject(new Error('Não foi possível carregar a Meta. Verifique sua conexão e tente novamente.'));
        };
        const timer = window.setTimeout(fail, 20000);
        script.onerror = fail;
        script.onload = () => {
          window.clearTimeout(timer);
          if (window.FB) resolve(); else fail();
        };
        document.head.appendChild(script);
      }).catch(error => { this.loading = undefined; throw error; });
      await this.loading;
    }
    window.FB!.init({ appId: config.appId, cookie: true, xfbml: false, version: config.graphApiVersion });
  }

  cancel(): void { this.cancelActive?.(); }

  // Called synchronously from the click so browsers allow the Meta popup.
  start(config: SignupConfig, pin: string | null): Promise<CompleteSignup> {
    if (this.cancelActive) return Promise.reject(new Error('Uma conexão já está em andamento.'));
    return new Promise((resolve, reject) => {
      let code: string | undefined;
      let details: Omit<CompleteSignup, 'code' | 'pin'> | undefined;
      let settled = false;
      const cleanup = () => {
        settled = true;
        window.clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        this.cancelActive = undefined;
        code = undefined;
        details = undefined;
      };
      const fail = (message: string) => { if (!settled) { cleanup(); reject(new Error(message)); } };
      const finish = () => {
        if (settled || !code || !details) return;
        const payload = { ...details, code, pin: details.event === config.coexistenceFinishEvent ? null : pin };
        cleanup();
        resolve(payload);
      };
      const onMessage = (message: MessageEvent) => {
        if (settled || !['https://www.facebook.com', 'https://web.facebook.com'].includes(message.origin)) return;
        let data;
        try { data = typeof message.data === 'string' ? JSON.parse(message.data) : message.data; } catch { return; }
        if (!data || data.type !== config.sessionInfoEventType) return;
        if (data.event === 'CANCEL') { fail('Conexão cancelada. Você pode tentar novamente.'); return; }
        if (data.event === 'ERROR') { fail('A Meta não conseguiu concluir a conexão. Tente novamente.'); return; }
        if (!['FINISH', config.coexistenceFinishEvent].includes(data.event)) return;
        const ids = data.data;
        if (!ids || typeof ids.waba_id !== 'string' || !/^\d+$/.test(ids.waba_id)
          || typeof ids.phone_number_id !== 'string' || !/^\d+$/.test(ids.phone_number_id)
          || (ids.business_id != null && (typeof ids.business_id !== 'string' || !/^\d+$/.test(ids.business_id)))) {
          fail('A Meta retornou uma conexão incompleta. Tente novamente.'); return;
        }
        details = { event: data.event, wabaId: ids.waba_id, phoneNumberId: ids.phone_number_id, businessId: ids.business_id ?? null };
        finish();
      };
      const timer = window.setTimeout(() => fail('O tempo para conectar expirou. Tente novamente.'), 5 * 60 * 1000);
      this.cancelActive = () => fail('Conexão cancelada. Você pode tentar novamente.');
      window.addEventListener('message', onMessage);
      try {
        if (!window.FB) { fail('A Meta ainda não está pronta. Tente novamente.'); return; }
        window.FB.login(response => {
          if (settled) return;
          const receivedCode = response.authResponse?.code;
          if (typeof receivedCode !== 'string' || !receivedCode) { fail('Conexão não autorizada. Tente novamente.'); return; }
          code = receivedCode;
          finish();
        }, { config_id: config.configurationId, response_type: 'code', override_default_response_type: true,
          extras: { setup: {}, sessionInfoVersion: '3' } });
      } catch { fail('Não foi possível abrir a Meta. Permita pop-ups e tente novamente.'); }
    });
  }
}
