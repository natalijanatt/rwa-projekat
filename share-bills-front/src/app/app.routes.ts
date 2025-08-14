import { Routes } from '@angular/router';
import { OfflineComponent } from './pages/utility/offline/offline.component';
import { Error500Component } from './pages/utility/error500/error500.component';
import { Error404Component } from './pages/utility/error404/error404.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard, matchAuthGuard, redirectLoggedInToApp } from './core/guards/auth.guard';

export const routes: Routes = [
  //PUBLIC ROUTES
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/dashboard/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    canMatch:[redirectLoggedInToApp],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  //add register route
  { path: 'offline', component: OfflineComponent },
  { path: '500', component: Error500Component },
  { path: '**', component: Error404Component },

  //PRIVATE ROUTES
  
];
