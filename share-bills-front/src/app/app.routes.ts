import { Routes } from '@angular/router';
import { OfflineComponent } from './pages/utility/offline/offline.component';
import { Error500Component } from './pages/utility/error500/error500.component';
import { Error404Component } from './pages/utility/error404/error404.component';
import {
  authGuard,
  matchAuthGuard,
  redirectLoggedInToApp,
} from './core/guards/auth.guard';

export const routes: Routes = [
  // public
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/dashboard/home.component').then((m) => m.HomeComponent),
  },

  {
    path: 'login',
    pathMatch: 'full',
    canMatch: [redirectLoggedInToApp],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'register',
    pathMatch: 'full',
    canMatch: [redirectLoggedInToApp],
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },

  // private
  {
    path: 'me',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/user/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },
  {
    path: 'groups/create',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/groups/group-create/group-create.component').then(
        (m) => m.GroupCreateComponent
      ),
  },

  {
    path: 'groups/:id/expenses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/groups/group-expenses/group-expenses.component').then(
        (m) => m.GroupExpensesComponent
      ),
  },

  {
    path: 'expenses/:expenseId/group/:groupId',
    canActivate: [authGuard],
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/expenses/expense-details/expense-details.component').then(
        (m) => m.ExpenseDetailsComponent
      ),
  },
  {
    path: 'groups/:id',
    canActivate: [authGuard],
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/groups/groups-all/groups-all.component').then(
        (m) => m.GroupsAllComponent
      ),
  },

  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/groups/groups-all/groups-all.component').then(
        (m) => m.GroupsAllComponent
      ),
  },
  {
    path: 'expenses/missed',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/expenses/expenses-missed/expenses-missed.component').then(
        (m) => m.ExpensesMissedComponent
      ),
  },
  {
    path: 'expenses/my',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/expenses/my-expenses/my-expenses.component').then(
        (m) => m.MyExpensesComponent
      ),
  },
  
  { path: 'offline', component: OfflineComponent },
  { path: '500', component: Error500Component },
  { path: '**', component: Error404Component },
];
