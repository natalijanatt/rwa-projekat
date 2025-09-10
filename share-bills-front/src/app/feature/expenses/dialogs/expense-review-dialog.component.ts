// src/app/feature/expenses/dialogs/expense-review-dialog.component.ts
import { Component, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs/operators';

import { MatDialogModule } from '@angular/material/dialog';
import { AsyncPipe, NgIf } from '@angular/common';
import { PendingExpenseEvent } from '../../realtime/realtime-events';
import { RealtimeStreamService } from '../../realtime/realtime-stream.service';
import { ExpenseService } from '../expense.service';

@Component({
  selector: 'app-expense-review-dialog',
  templateUrl: './expense-review-dialog.component.html',
  styleUrls: ['./expense-review-dialog.component.scss'],
  imports: [MatDialogModule,  NgIf, AsyncPipe]
})
export class ExpenseReviewDialogComponent {

  ngOnInit() {
    // Component initialized with expense data
  }
  data = inject(MAT_DIALOG_DATA) as { event: PendingExpenseEvent };
  ref = inject(MatDialogRef<ExpenseReviewDialogComponent>);
  svc = inject(RealtimeStreamService);
  expenseSvc = inject(ExpenseService);
  destroyRef = inject(DestroyRef);

  loading = false;
  memberId = this.data.event.me.memberId;

  remaining$ = this.svc.countdown$(this.data.event.expense.id).pipe(
  map(t => {
    const totalSeconds = Math.floor(t.data?.msLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}.${seconds.toString().padStart(2, '0')}`;
  }),
  tap(display => {
    if (display === '0.00') {
      this.ref.close(false);
    }
  }),
  takeUntilDestroyed(this.destroyRef)
);

  
  vote(status: 'accepted'|'declined') {
    this.loading = true;
    this.expenseSvc.respond(this.data.event.expense.id, this.memberId, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.ref.close(true),
        error: () => (this.loading = false)
      });
  }

  formatCurrency(amount: number, currencyCode?: string): string {
    const code = currencyCode || this.data.event.groupCurrencyCode || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

