import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./feature/dashboard/home.component').then(m => m.HomeComponent)
    }
];
