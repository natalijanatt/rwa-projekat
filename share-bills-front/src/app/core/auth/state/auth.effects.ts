// src/app/features/auth/state/auth.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from './auth.actions';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenState } from '../token.state';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap, tap, exhaustMap, filter } from 'rxjs';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private api = inject(AuthService);
  private tokens = inject(TokenState);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.api.login({ email, password }).pipe(
          tap((t: any) =>
            this.tokens.setToken(t.accessToken ?? t.access_token)
          ),
          switchMap(() => this.api.me()),
          switchMap((user) =>
            of(
              AuthActions.loginSuccess({
                accessToken: this.tokens.accessToken() ?? '',
              }),
              AuthActions.loadUserSuccess({ user })
            )
          ),
          catchError((err) =>
            of(
              AuthActions.loginFailure({
                error: err?.error?.message ?? 'Login failed',
              })
            )
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
          map((user) => AuthActions.loadUserSuccess({ user })),
          catchError((err) =>
            of(AuthActions.loadUserFailure({ error: err?.error?.message }))
          )
        )
      )
    )
  );

navigateAfterLogin$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserSuccess),
      tap(() => {
        const currentUrl = this.router.url;
        const tree = this.router.parseUrl(currentUrl);
        const raw = tree.queryParams['redirect'];

        if (typeof raw === 'string' && raw.startsWith('/')) {
          this.router.navigateByUrl(raw, { replaceUrl: true });
          return;
        }

        if (currentUrl.startsWith('/login') || currentUrl.startsWith('/register')) {
          this.router.navigateByUrl('/', { replaceUrl: true });
          return;
        }
        
      })
    ),
  { dispatch: false }
);


  init$ = createEffect(() =>
    of(this.tokens.accessToken()).pipe(
      // only dispatch if we actually have a token
      map((t) => !!t),
      filter(Boolean),
      map(() => AuthActions.loadUser())
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
