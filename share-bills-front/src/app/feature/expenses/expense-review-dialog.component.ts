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
    <div class="expense-review-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title class="dialog-title">Review Expense</h2>
        <div class="countdown" *ngIf="remaining$ | async as r">
          <span class="countdown-label">Time remaining:</span>
          <span class="countdown-time">{{r}}s</span>
        </div>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div class="expense-card">
          <div class="expense-header">
            <h3 class="expense-title">{{data.event.expense.title}}</h3>
            <div class="expense-amount">{{data.event.expense.amount | currency}}</div>
          </div>
          
          <div class="expense-details">
            <div class="detail-item">
              <span class="detail-label">Group:</span>
              <span class="detail-value">{{data.event.groupName}}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Paid by:</span>
              <span class="detail-value">{{data.event.paidByName}}</span>
            </div>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button 
                class="action-button reject-button" 
                (click)="vote('declined')" 
                [disabled]="loading">
          <span class="button-text">Reject</span>
        </button>
        <button mat-flat-button 
                class="action-button accept-button" 
                (click)="vote('accepted')" 
                [disabled]="loading">
          <span class="button-text">Accept</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .expense-review-dialog {
      background: #1a1a1a;
      color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      min-width: 480px;
    }

    .dialog-header {
      background: linear-gradient(135deg, #007F9F, #6f42c1);
      padding: 1.5rem;
      text-align: center;
      position: relative;
    }

    .dialog-title {
      color: #ffffff;
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .countdown {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .countdown-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .countdown-time {
      font-weight: 700;
      font-size: 1rem;
      color: #ffffff;
    }

    .dialog-content {
      padding: 2rem;
      background: #2b2b2b;
    }

    .expense-card {
      background: rgba(0, 127, 159, 0.05);
      border: 1px solid #404040;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .expense-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .expense-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
      flex: 1;
      line-height: 1.3;
    }

    .expense-amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #007F9F;
      white-space: nowrap;
    }

    .expense-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 0.875rem;
      color: #adb5bd;
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.875rem;
      color: #ffffff;
      font-weight: 600;
    }

    .dialog-actions {
      padding: 1.5rem 2rem;
      background: #2b2b2b;
      border-top: 1px solid #404040;
      gap: 1rem;
    }

    .action-button {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      min-width: 100px;
    }

    .reject-button {
      color: #dc3545;
      border-color: #dc3545;
      background: transparent;
      
      &:hover:not(:disabled) {
        background: rgba(220, 53, 69, 0.1);
        border-color: #dc3545;
        transform: translateY(-1px);
      }
    }

    .accept-button {
      background: linear-gradient(135deg, #007F9F, #005a7a);
      color: #ffffff;
      border: none;
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #005a7a, #004466);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 127, 159, 0.3);
      }
    }

    .button-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 600px) {
      .expense-review-dialog {
        min-width: 320px;
      }
      
      .dialog-header {
        padding: 1rem;
      }
      
      .dialog-content {
        padding: 1.5rem;
      }
      
      .dialog-actions {
        padding: 1rem 1.5rem;
        flex-direction: column;
        
        .action-button {
          width: 100%;
        }
      }
      
      .expense-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `],
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
