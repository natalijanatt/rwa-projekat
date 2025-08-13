import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthState } from '../auth/auth.state';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const state = inject(AuthState);
  const router = inject(Router);
  if (state.isAuthenticated) return true;
  router.navigate(['/login'], { queryParams: { redirect: location.pathname } });
  return false;
};
