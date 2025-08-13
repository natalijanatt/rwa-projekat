import { Routes } from '@angular/router';
import { OfflineComponent } from './pages/utility/offline/offline.component';
import { Error500Component } from './pages/utility/error500/error500.component';
import { Error404Component } from './pages/utility/error404/error404.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  { path: 'offline', component: OfflineComponent },
  { path: '500', component: Error500Component },
  { path: '**', component: Error404Component },
];
