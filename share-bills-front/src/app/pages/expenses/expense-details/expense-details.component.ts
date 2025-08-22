import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseService } from '../../../feature/expenses/expense.service';
import { FullExpenseDto } from '../../../feature/expenses/data/expense-full.dto';
import {
  AsyncPipe,
  DatePipe,
  CurrencyPipe,
  NgIf,
  NgFor,
  NgClass,
  TitleCasePipe,
} from '@angular/common';
import {
  map,
  filter,
  distinctUntilChanged,
  switchMap,
  catchError,
  of,
  shareReplay,
  single,
  tap,
} from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Store } from '@ngrx/store';
import { selectUser } from '../../../core/auth/state/auth.selectors';

import { UserDto } from '../../../feature/users/data/user.dto';
@Component({
  selector: 'app-expense-details',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    AsyncPipe,
    DatePipe,
    CurrencyPipe,
    RouterLink,
    TitleCasePipe,
    ButtonComponent,
  ],
  templateUrl: './expense-details.component.html',
  styleUrl: './expense-details.component.scss',
})
export class ExpenseDetailsComponent {
  private expenseService = inject(ExpenseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);
  participated = signal(false);

  ngOnInit() {
    this.store
      .select(selectUser)
      .pipe(
        filter((user): user is UserDto => !!user),
        switchMap((user) =>
          this.expense$.pipe(
            filter((exp): exp is FullExpenseDto => !!exp),
            tap((exp: FullExpenseDto) => {
              console.log('Expense details:', exp);
              const isParticipant = exp.participants.some(
                (p) => p.user.id === user.id
              );
              this.participated.set(isParticipant);
            })
          )
        )
      )
      .subscribe();
  }

  // Stream the expense directly from route params
  expense$ = this.route.paramMap.pipe(
    map((pm) => ({
      expenseId: Number(pm.get('expenseId')),
      groupId: Number(pm.get('groupId')),
    })),
    filter(
      ({ groupId, expenseId }) =>
        Number.isFinite(groupId) && Number.isFinite(expenseId)
    ),
    distinctUntilChanged(
      (a, b) => a.groupId === b.groupId && a.expenseId === b.expenseId
    ),
    switchMap(({ groupId, expenseId }) =>
      this.expenseService.getExpense(expenseId, groupId).pipe(
        catchError((err) => {
          console.error('Failed to load expense', err);
          this.router.navigate(['/groups', groupId], { replaceUrl: true });
          return of(null);
        })
      )
    ),
    shareReplay(1)
  );

  handleExpense(status: 'accepted' | 'declined') {
    this.expense$
      .pipe(
        filter((exp): exp is FullExpenseDto => !!exp),
        switchMap((exp) =>
          this.expenseService.respondLate(exp.id, exp.group.id, status).pipe(
            catchError((err) => {
              console.error('Failed to update expense status', err);
              return of(null);
            })
          )
        )
      )
      .subscribe(() => {
        this.router.navigate(['expenses/my']);
      });
  }

  trackByMember = (_: number, m: any) => m?.id ?? m?.user?.id ?? _;
}
