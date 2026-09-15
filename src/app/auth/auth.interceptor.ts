import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
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

  return next(request).pipe(
    catchError(error => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        hasAuthorization &&
        request.url.startsWith(environment.apiBaseUrl) &&
        !isPublicRequest(request.url)
      ) {
        auth.logout();
      }

      return throwError(() => error);
    })
  );
};
