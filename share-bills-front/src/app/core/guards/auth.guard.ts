import { CanActivateFn, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { TokenState } from '../auth/token.state';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const state = inject(TokenState);
  const router = inject(Router);
  if (state.isAuthenticated) return true;
  router.navigate(['/login'], { queryParams: { redirect: location.pathname } });
  return false;
};

export const matchAuthGuard: CanMatchFn = (_route,segments) => {
  const auth = inject(TokenState);
  const router = inject(Router);
  if (auth.isAuthenticated) return true;
  const intended = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], {
    queryParams: { redirect: intended },
  });
};

export const redirectLoggedInToApp: CanMatchFn = () => {
  const auth = inject(TokenState);
  const router = inject(Router);
  return auth.isAuthenticated ? router.createUrlTree(['/']) : true;
};