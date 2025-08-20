// src/app/feature/expenses/expense-review-dialog.component.ts
import { Component, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExpenseStreamService, PendingExpenseEvent } from './expense-stream.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs/operators';

import { MatDialogModule } from '@angular/material/dialog';
import { AsyncPipe, CurrencyPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-expense-review-dialog',
  template: `
    <h2 mat-dialog-title>Approve this expense?</h2>
    <mat-dialog-content>
      <div class="grid gap-2">
        <div class="font-semibold">{{data.event.expense.title}}</div>
        <div>Amount: {{data.event.expense.amount | currency}}</div>
        <div>Group:</div>
        <div>Paid by</div>
        <div class="text-sm opacity-70" *ngIf="remaining$ | async as r">Time left: {{r}}s</div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="vote('declined')" [disabled]="loading">Reject</button>
      <button mat-flat-button color="primary" (click)="vote('accepted')" [disabled]="loading">Accept</button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule, CurrencyPipe, NgIf, AsyncPipe]
})
export class ExpenseReviewDialogComponent {

  ngOnInit() {
    console.log('ExpenseReviewDialogComponent initialized with data:', this.data);
  }
  data = inject(MAT_DIALOG_DATA) as { event: PendingExpenseEvent };
  ref = inject(MatDialogRef<ExpenseReviewDialogComponent>);
  svc = inject(ExpenseStreamService);
  destroyRef = inject(DestroyRef);

  loading = false;
  memberId = this.data.event.me.memberId;

  remaining$ = this.svc.countdown$(this.data.event.expense.id).pipe(
  map(t => {
    const totalSeconds = Math.floor(t.msLeft / 1000);
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
    this.svc.respond(this.data.event.expense.id, this.memberId, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.ref.close(true),
        error: () => (this.loading = false)
      });
  }
}
