import { createReducer, on } from '@ngrx/store';
import { UserDto } from '../../../feature/users/data/user.dto';
import { AuthActions } from './auth.actions';

export type AuthStatus = 'anonymous' | 'authenticated' | 'loading' | 'error';

export interface AuthState {
  user: UserDto | null;
  status: string;
  error?: string;
}

export const initialAuthState: AuthState = {
  user: null,
  status: 'anonymous',
  error: undefined,
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, (state) => ({
    ...state,
    status: 'loading',
  })),
  on(AuthActions.loginSuccess, (state, { accessToken }) => ({
    ...state,
    status: 'authenticated',
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    status: 'error',
  })),
  on(AuthActions.loadUser, (state) => ({
    ...state,
    status: 'loading',
  })),
  on(AuthActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
  })),
  on(AuthActions.loadUserFailure, (state, { error }) => ({
    ...state,
    status: 'error',
  })),
  on(AuthActions.logout, () => initialAuthState)
);
