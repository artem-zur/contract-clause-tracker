import { Component, inject, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContractClient, Contract } from './contract-client';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-contract-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './contract-view.html',
})
export class ContractView {
  private readonly contractClient = inject(ContractClient);
  private readonly router = inject(Router);
  
  readonly id = input.required<string>();
  
  readonly contract = signal<Contract | null>(null);
  readonly isLoading = signal<boolean>(false);

  constructor() {
    // Automatically re-fetch backend datasets if the parameter ID signal shifts
    effect(() => {
      this.loadContract(this.id());
    });
  }

  private loadContract(id: string): void {
    this.isLoading.set(true);
    this.contractClient.getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (contract) => this.contract.set(contract),
        error: (err) => {
          console.error('Failed to resolve targeted contract content canvas:', err);
          this.router.navigate(['/']);
        }
      });
  }
}