import { Routes } from '@angular/router';
import { Dashboard } from './dasboard/dashboard';

export const routes: Routes = [
{ 
    path: '', 
    component: Dashboard 
  },
  // TODO: Add a route for the contract view component, e.g. { path: 'contracts/:id', component: ContractView }
  { 
    path: '**', 
    redirectTo: '' 
  }
];
