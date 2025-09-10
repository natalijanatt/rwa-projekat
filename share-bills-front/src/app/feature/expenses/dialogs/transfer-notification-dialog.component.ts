import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransferExpenseEvent } from '../../realtime/realtime-events';

export interface TransferNotificationDialogData {
  event: TransferExpenseEvent;
}

@Component({
  selector: 'app-transfer-notification-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './transfer-notification-dialog.component.html',
  styleUrls: ['./transfer-notification-dialog.component.scss']
})
export class TransferNotificationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TransferNotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransferNotificationDialogData
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
