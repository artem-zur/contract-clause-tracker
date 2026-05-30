import { Component, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { Upload } from './upload/upload';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Contract, ContractClient } from './contract-client';
import { finalize } from 'rxjs/internal/operators/finalize';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Upload,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly contractClient = inject(ContractClient);
  private readonly router = inject(Router);

  // Columns tracking structural table layouts
  readonly displayedColumns: string[] = ['name', 'clauses'];

  // Signal state management wrappers
  readonly isLoading = signal<boolean>(false);
  readonly contracts = signal<Contract[]>([]);

  // Core Data Source initialization
  readonly dataSource = new MatTableDataSource<Contract>();

  // Angular 21 Signal-based view query for component sort headers
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

  // TODO: Interactive handler placeholder for future routing implementation
  onRowClick(row: Contract): void {
    console.log(`Navigating to document inspection views for ID: ${row.id} (${row.title})`);
    // TODO: this.router.navigate(['/contract', row.id]);
  }

  isHomePage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.isActive('/', {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored'
      }))
    ),
    { 
      initialValue: this.router.isActive('/', {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored'
      })
    }
  );
}
