import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResponseExpenseEvent } from '../../realtime/realtime-events';

export interface ExpenseDeclinedDialogData {
  event: ResponseExpenseEvent;
}

@Component({
  selector: 'app-expense-declined-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule ],
  templateUrl: './expense-declined-dialog.component.html',
  styleUrls: ['./expense-declined-dialog.component.scss']
})
export class ExpenseDeclinedDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExpenseDeclinedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseDeclinedDialogData
  ) {}

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
