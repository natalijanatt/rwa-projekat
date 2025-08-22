import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenState } from '../auth/token.state';

const SSE_PATHS = ['/expenses/expense-stream', '/expenses/countdown/'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const state = inject(TokenState);
  const router = inject(Router);

  // 1) Stable token source (fixes first-load race)
  const token =
    state.accessToken?.() ??
    localStorage.getItem('access_token') ??
    undefined;

  // 2) Skip SSE endpoints (EventSource can’t use these headers anyway)
  const isSse = SSE_PATHS.some((p) => req.url.includes(p));

  const authReq = !isSse && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // optional: only redirect if we're not already on /login
        state.clear();
        if (!location.pathname.startsWith('/login')) {
          router.navigate(['/login'], { queryParams: { redirect: location.pathname } });
        }
      }
      return throwError(() => err);
    })
  );
};
