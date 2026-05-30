import { Component, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { Upload } from './upload/upload';
import { NgClass } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs/internal/operators/finalize';
import { Clause, ClauseTypeCode, Contract, ContractClient } from '../contract-client';
import { Router } from '@angular/router';

const CLAUSE_STYLE_MAP: Record<ClauseTypeCode | 'default', string> = {
  [ClauseTypeCode.LimitationOfLiability]: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  [ClauseTypeCode.TerminationForConvenience]: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  [ClauseTypeCode.NonCompete]: 'bg-teal-50 text-teal-700 ring-teal-600/10',
  'default': 'bg-slate-50 text-slate-700 ring-slate-600/10'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    Upload,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    NgClass
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly contractClient = inject(ContractClient);
  private readonly router = inject(Router);

  // Columns tracking structural table layouts
  readonly displayedColumns: string[] = ['name', 'clauses'];

  // Signal state management wrappers
  readonly isLoading = signal<boolean>(false);
  readonly contracts = signal<Contract[]>([]);

  // Core Data Source initialization
  readonly dataSource = new MatTableDataSource<Contract>();

  readonly sort = viewChild(MatSort);

  constructor() {
    // Keeps the internal MatTableDataSource updated when the contracts signal changes
    effect(() => {
      this.dataSource.data = this.contracts();
    });

    // Wire up the Material sorting configuration reactively whenever the sorting directive resolves
    effect(() => {
      const activeSort = this.sort();
      if (activeSort) {
        this.dataSource.sort = activeSort;
      }
    });
  }

  ngOnInit(): void {
    this.loadContracts();
  }

  /**
   * Pulls production state datasets from the database through the contract client stream
   */
  loadContracts(): void {
    this.isLoading.set(true);

    this.contractClient.getAll()
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.contracts.set(data);
        },
        error: (err) => {
          console.error('Failed to resolve contract collection from backend storage services:', err);
          this.contracts.set([]);
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onRowClick(row: Contract): void {
    this.router.navigate(['/contract', row.id]);
  }

  getUniqueClauses(clauses: Clause[] | undefined): Clause[] {
    if (!clauses || clauses.length === 0) return [];
    
    const seen = new Set<string>();

    return clauses.filter(clause => {
      const code = clause.clauseType?.code;
      
      if (!code || seen.has(code)) return false;
      seen.add(code);

      return true;
    });
  }

  getClauseStyle(code: string | undefined): string {
    if (!code) return CLAUSE_STYLE_MAP['default'];
    
    return CLAUSE_STYLE_MAP[code as ClauseTypeCode] || CLAUSE_STYLE_MAP['default'];
  }
}
