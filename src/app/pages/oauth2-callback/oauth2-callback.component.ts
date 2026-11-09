import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  template: '',
})
export class OAuth2CallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    // "token" é o formato antigo do backend, mantido só durante a transição do deploy.
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (code || token) {
      // Tira o código/token da barra de endereço e do histórico antes de qualquer outra coisa.
      history.replaceState(null, '', location.pathname);
    }
    if (code) {
      this.auth.handleGoogleCode(code);
    } else if (token) {
      this.auth.handleGoogleCallback(token);
    } else {
      if (error === 'google_email_not_verified') {
        this.auth.error.set('O e-mail desta conta Google ainda não foi verificado pelo Google. Verifique o e-mail na sua conta Google ou cadastre-se com e-mail e senha.');
      } else if (error === 'email_already_registered') {
        this.auth.error.set('Este e-mail já está cadastrado com login local. Entre com e-mail e senha.');
      } else if (error) {
        this.auth.error.set('Não foi possível entrar com o Google. Tente novamente ou use e-mail e senha.');
      }
      this.router.navigate(['/login']);
    }
  }
}
