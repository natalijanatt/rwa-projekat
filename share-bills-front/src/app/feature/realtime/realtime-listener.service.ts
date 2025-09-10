import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RealtimeStreamService } from './realtime-stream.service';
import { filter, tap } from 'rxjs/operators';
import { ExpenseReviewDialogComponent } from '../expenses/dialogs/expense-review-dialog.component';
import { TransferNotificationDialogComponent } from '../expenses/dialogs/transfer-notification-dialog.component';
import { ExpenseAcceptedDialogComponent } from '../expenses/dialogs/expense-accepted-dialog.component';
import { ExpenseDeclinedDialogComponent } from '../expenses/dialogs/expense-declined-dialog.component';
import { ExpenseFinalizedDialogComponent } from '../expenses/dialogs/expense-finalized-dialog.component';


@Injectable({ providedIn: 'root' })
export class RealtimeListener {
  private realtime = inject(RealtimeStreamService);
  private dialog = inject(MatDialog);

  init() {
    this.realtime
      .pending$()
      .pipe(
        tap((ev) => {}),
        filter(Boolean),
      )
      .subscribe((pending) => {
        const id = pending.expense.id;
        this.realtime.markPendingDialogShown(id);
        this.dialog.open(ExpenseReviewDialogComponent, {
          data: { event: pending },
          disableClose: true,
        });
      });
    this.realtime.responded$().subscribe((e) => {
        // Handle expense responded event
        if (e.status === 'accepted') {
          this.dialog.open(ExpenseAcceptedDialogComponent, {
            data: { event: e },
            disableClose: false,
            width: '500px',
            maxWidth: '90vw'
          });
        } else if (e.status === 'declined') {
          this.dialog.open(ExpenseDeclinedDialogComponent, {
            data: { event: e },
            disableClose: false,
            width: '500px',
            maxWidth: '90vw'
          });
        }
    });

    this.realtime.finalized$().subscribe((e) => {
        // Handle expense finalized event
        this.dialog.open(ExpenseFinalizedDialogComponent, {
          data: { event: e },
          disableClose: false,
          width: '550px',
          maxWidth: '90vw'
        });
    });

    this.realtime.transferred$().subscribe((e) => {
        // Handle expense transferred event
        this.dialog.open(TransferNotificationDialogComponent, {
          data: { event: e },
          disableClose: false,
          width: '500px',
          maxWidth: '90vw'
        });
    });
  }
}
