import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResponseExpenseEvent } from '../../realtime/realtime-events';
export interface ExpenseAcceptedDialogData {
  event: ResponseExpenseEvent;
}

@Component({
  selector: 'app-expense-accepted-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './expense-accepted-dialog.component.html',
  styleUrls: ['./expense-accepted-dialog.component.scss']
})
export class ExpenseAcceptedDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExpenseAcceptedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseAcceptedDialogData
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
