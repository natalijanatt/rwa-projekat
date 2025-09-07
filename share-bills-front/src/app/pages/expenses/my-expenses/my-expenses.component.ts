import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { map, switchMap, combineLatestWith, shareReplay, filter as rxFilter } from 'rxjs';

import { ExpenseService } from '../../../feature/expenses/expense.service';
import { ExpenseBaseDto } from '../../../feature/expenses/data/expense-base.dto';
import { ExpenseFilterDto } from '../../../feature/expenses/data/expense-filter.dto';
import { selectUser } from '../../../core/auth/state/auth.selectors';
import { ExpenseFiltersComponent } from '../../../shared/components/expense-filters/expense-filters.component';
import { ExpensePaginatedDto } from '../../../feature/expenses/data/expense-paginated.dto';

@Component({
  selector: 'app-my-expenses',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    AsyncPipe,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ExpenseFiltersComponent,
  ],
  templateUrl: './my-expenses.component.html',
  styleUrls: ['./my-expenses.component.scss'],
})
export class MyExpensesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);
  private expenseService = inject(ExpenseService);

  // Make Math available in template
  Math = Math;

  /** Build effective filters from URL + current user */
  filters$ = this.route.queryParamMap.pipe(
    combineLatestWith(this.store.select(selectUser).pipe(rxFilter(Boolean))),
    map(([pm, user]) => {
      const toNum = (v: string | null) => (v !== null && v !== '' ? Number(v) : undefined);
      const currentPage = toNum(pm.get('page')) ?? 1;

      const f: ExpenseFilterDto = {
        userId: user!.id,                                       // ALWAYS include
        groupId: toNum(pm.get('groupId')),
        status: (pm.get('status') as any) || undefined,
        paidBy: toNum(pm.get('paidBy')),
        ordredBy: (pm.get('ordredBy') as any) || 'createdAt',
        orderDirection: (pm.get('orderDirection') as any) || 'DESC',
        page: currentPage > 0 ? currentPage : 1,
      };
      return f;
    })
  );

  /** Fetch and normalize page */
  page$ = this.filters$.pipe(
    switchMap((f) => this.expenseService.getExpenses(f)),
    map((res): ExpensePaginatedDto => {
      console.log('Fetched expenses:', res);
      // Normalize backend differences: totalCount vs totalItems
      const totalItems = Number(res.totalItems ?? 0);
      const pageSize = Number(res.pageSize ?? 20);
      const page = Number(res.page ?? 1);
      const totalPages = Number(res.totalPages ?? (res.totalPages ? Math.ceil(totalItems / pageSize) : 0));
      console.log('totalPages',totalPages)
      return {
        items: res.items ?? [],
        page,
        pageSize,
        totalItems,
        totalPages,
      };
    }),
    shareReplay(1)
  );

  /** Filters -> update URL (reset page to 1) */
  onFiltersChange(f: ExpenseFilterDto) {
    this.updateQueryParams({
      groupId: f.groupId ?? null,
      status: f.status ?? null,
      paidBy: f.paidBy ?? null,
      ordredBy: f.ordredBy ?? 'createdAt',
      orderDirection: f.orderDirection ?? 'DESC',
      page: 1,
    });
  }

  onPageChange(e: PageEvent) {
    console.log('Page changed:', e);
    this.updateQueryParams({
      page: e.pageIndex + 1,
    });
  }

  onOpenExpense(expense: ExpenseBaseDto) {
    this.router.navigate([`/expenses/${expense.id}/group/${expense.groupId}`]);
  }

  onCreateNewExpense() {
    this.router.navigate(['/expenses/create']);
  }

  trackByExpenseId(index: number, expense: ExpenseBaseDto): number {
    return expense.id;
  }

  getStatusClass(expense: ExpenseBaseDto): string {
    // This is a simplified status - in a real app you'd get this from the expense data
    if (expense.finalizedAt) {
      return 'status-finalized';
    }
    return 'status-pending';
  }

  getStatusText(expense: ExpenseBaseDto): string {
    if (expense.finalizedAt) {
      return 'Finalized';
    }
    return 'Pending';
  }

  private updateQueryParams(params: Record<string, any>) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
