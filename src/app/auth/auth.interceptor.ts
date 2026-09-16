import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

const publicApiPaths = [
  '/api/v1/auth',
  '/api/v1/invitations/',
  '/oauth2/',
];

function isPublicRequest(url: string): boolean {
  return publicApiPaths.some(path => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const hasAuthorization = request.headers.has('Authorization');
  const isApiRequest = request.url.startsWith(environment.apiBaseUrl);

  return next(request).pipe(
    tap(event => {
      // A API gera um novo token a cada requisição autenticada — precisa substituir o armazenado.
      if (event instanceof HttpResponse && hasAuthorization && isApiRequest) {
        const authHeader = event.headers.get('Authorization');
        if (authHeader) {
          auth.updateToken(authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);
        }
      }
    }),
    catchError(error => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        hasAuthorization &&
        isApiRequest &&
        !isPublicRequest(request.url)
      ) {
        auth.logout();
      }

      return throwError(() => error);
    })
  );
};
