// auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenState } from '../auth/token.state';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const state = inject(TokenState);
  const router = inject(Router);

  const token = state.accessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        state.clear();
        router.navigate(['/login'], { queryParams: { redirect: location.pathname } });
      }
      // rethrow so callers still see the error
      return throwError(() => err);
    })
  );
};
