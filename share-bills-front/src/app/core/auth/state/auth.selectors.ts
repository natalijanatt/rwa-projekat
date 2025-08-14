import { createFeatureSelector, createSelector } from "@ngrx/store";
import { AuthState } from "./auth.reducer";

export const selectAuth = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuth,
  (state: AuthState) => state.user
);
export const selectIsAuth = createSelector(selectAuth, s => s.status === 'authenticated');
export const selectAuthStatus = createSelector(selectAuth, s => s.status);
export const selectGroups = createSelector(selectAuth, s => s.user?.memberships ?? []);
