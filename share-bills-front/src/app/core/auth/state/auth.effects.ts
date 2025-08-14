// src/app/features/auth/state/auth.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from './auth.actions';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenState } from '../token.state';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap, tap, exhaustMap } from 'rxjs';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private api = inject(AuthService);
  private tokens = inject(TokenState);
  private router = inject(Router);

  /** Login: call /auth/login, stash token, fetch /auth/me, put user in store */
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.api.login({ email, password }).pipe(
          // support either {accessToken} or {access_token}
          tap((t: any) => this.tokens.setToken(t.accessToken ?? t.access_token)),
          switchMap(() => this.api.me()),
          map(user => AuthActions.loginSuccess({ accessToken: this.tokens.accessToken() ?? '' })),
          catchError(err =>
            of(AuthActions.loginFailure({ error: err?.error?.message ?? 'Login failed' }))
          )
        )
      )
    )
  );

  /** Load current user if token exists (e.g., on app start) */
  loadMe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      switchMap(() =>
        this.api.me().pipe(
          map(user => AuthActions.loadUserSuccess({ user })),
          catchError(err => of(AuthActions.loadUserFailure({ error: err?.error?.message })))
        )
      )
    )
  );

  /** On logout: clear tokens and go to /login */
  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => this.tokens.clear()),
        tap(() => this.router.navigate(['/login']))
      ),
    { dispatch: false }
  );
}
