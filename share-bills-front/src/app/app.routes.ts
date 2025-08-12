import { Routes } from '@angular/router';
import { OfflineComponent } from './pages/utility/offline/offline.component';
import { Error500Component } from './pages/utility/error500/error500.component';
import { Error404Component } from './pages/utility/error404/error404.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/dashboard/home.component').then((m) => m.HomeComponent),
  },
  { path: 'offline', component: OfflineComponent },
  { path: '500', component: Error500Component },
  { path: '**', component: Error404Component },
];
