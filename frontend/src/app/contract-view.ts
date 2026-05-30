import { Component, inject, input, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContractClient } from './contract-client';
import { finalize } from 'rxjs/operators';
import { Contract } from './core/contract';
import { ClauseStylePipe } from './clause/clause-style';
import { parseContractSegments } from './contract-segmenter';
    
@Component({
  selector: 'app-contract-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ClauseStylePipe
  ],
  templateUrl: './contract-view.html',
})
export class ContractView {
  private readonly contractClient = inject(ContractClient);
  private readonly router = inject(Router);
  private readonly stylePipe = new ClauseStylePipe();
  
  readonly id = input.required<string>();
  readonly contract = signal<Contract | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly contractSegments = computed(() => 
    parseContractSegments(this.contract(), (code) => this.stylePipe.transform(code))
  );

  constructor() {
    // Automatically re-fetch backend datasets if the parameter ID signal shifts
    // TODO: Antipattern in Angular 21 - Using effects for state synchronization / async writes
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