import { Routes } from '@angular/router';
import { Dashboard } from './dasboard/dashboard';

export const routes: Routes = [
{ 
    path: '', 
    component: Dashboard 
  },
  { 
    path: 'contract/:id', 
    loadComponent: () => import('./contract-view').then(m => m.ContractView) 
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];
