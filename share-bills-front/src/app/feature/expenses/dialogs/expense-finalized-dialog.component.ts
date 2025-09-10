import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgIf } from '@angular/common';
import { FinalizedExpenseEvent } from '../../realtime/realtime-events';

export interface ExpenseFinalizedDialogData {
  event: FinalizedExpenseEvent;
}

@Component({
  selector: 'app-expense-finalized-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, NgIf, NgClass],
  templateUrl: './expense-finalized-dialog.component.html',
  styleUrls: ['./expense-finalized-dialog.component.scss']
})
export class ExpenseFinalizedDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExpenseFinalizedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseFinalizedDialogData
  ) {}

  get isRejected(): boolean {
    return this.data.event.expensePartcipantsCount <= 1;
  }

  get acceptedCount(): number {
    return this.data.event.expensePartcipantsCount;
  }

  get yourShare(): number {
    const totalAmount = this.data.event.expense.amount;
    const individualShare = totalAmount / (this.acceptedCount);    
    return totalAmount - (individualShare * (this.acceptedCount-1));
  }

  get individualShare(): number {
    return this.data.event.expense.amount / (this.acceptedCount);
  }

  onOk(): void {
    this.dialogRef.close();
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
