import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ExpenseStreamService } from './expense-stream.service';
import { filter, tap } from 'rxjs/operators';
import { ExpenseReviewDialogComponent } from './expense-review-dialog.component';

@Injectable({ providedIn: 'root' })
export class ExpenseReviewListener {
  private stream = inject(ExpenseStreamService);
  private dialog = inject(MatDialog);

  init() {
    this.stream
      .connect()
      .pipe(
        filter(Boolean),
        tap((ev) => console.log('[listener] pending event', ev))
      )
      .subscribe((event) => {
        const id = event.expense.id;
        console.log('[listener] pending expense', id, event);
        this.stream.markDialogShown(id);
        this.dialog.open(ExpenseReviewDialogComponent, {
          data: { event },
          disableClose: true,
        });
      });
  }

  private alreadyShown(id: number) {
    return false;
  } // optional extra local guard
}
