import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { CreateExpenseDto } from './data/expense-create.dto';
import { catchError, throwError } from 'rxjs';
import { ExpenseBaseDto } from './data/expense-base.dto';
import { FullExpenseDto } from './data/expense-full.dto';
import { ExpenseFilterDto } from './data/expense-filter.dto';
import { ExpensePaginatedDto } from './data/expense-paginated.dto';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getExpensesFromGroup(groupId: number): import('rxjs').Observable<ExpenseBaseDto[]> {
    const url = `${this.base}/expenses/${groupId}`;
    return this.http.get<ExpenseBaseDto[]>(url).pipe(
      catchError((err: HttpErrorResponse) => {
        const msg =
          (Array.isArray(err.error?.message)
            ? err.error.message.join(', ')
            : err.error?.message) ||
          err.message ||
          'Failed to fetch expenses';
        return throwError(() => ({ ...err, friendlyMessage: msg }));
      })
    );
  }

  getExpenses(filter: ExpenseFilterDto) {
    const params = new URLSearchParams();
    if (filter.groupId) params.set('groupId', filter.groupId.toString());
    if (filter.status) params.set('status', filter.status);
    if (filter.type) params.set('type', filter.type);
    if (filter.paidBy) params.set('paidBy', filter.paidBy.toString());
    if (filter.ordredBy) params.set('ordredBy', filter.ordredBy);
    if (filter.orderDirection) params.set('orderDirection', filter.orderDirection);
    if (filter.page) params.set('page', filter.page.toString());
    const url = `${this.base}/expenses?${params.toString()}`;
    return this.http.get<ExpensePaginatedDto>(url).pipe(
      catchError((err: HttpErrorResponse) => {
        const msg =
          (Array.isArray(err.error?.message)
            ? err.error.message.join(', ')
            : err.error?.message) ||
          err.message ||
          'Failed to fetch expenses';
        return throwError(() => ({ ...err, friendlyMessage: msg }));
      })
    );
  }

  getExpense(expenseId: number, groupId: number) {
    const url = `${this.base}/expenses/${expenseId}/${groupId}`;
    return this.http.get<FullExpenseDto>(url).pipe(
      catchError((err: HttpErrorResponse) => {
        const msg =
          (Array.isArray(err.error?.message)
            ? err.error.message.join(', ')
            : err.error?.message) ||
          err.message ||
          'Failed to fetch expense details';
        return throwError(() => ({ ...err, friendlyMessage: msg }));
      })
    );
  }

  getMissedExpenses(){
    const url = `${this.base}/expenses/missed`;
    return this.http.get<ExpenseBaseDto[]>(url).pipe(
      catchError((err: HttpErrorResponse) => {
        const msg =
          (Array.isArray(err.error?.message)
            ? err.error.message.join(', ')
            : err.error?.message) ||
          err.message ||
          'Failed to fetch missed expenses';
        return throwError(() => ({ ...err, friendlyMessage: msg }));
      })
    );
  }

  createExpense(dto: CreateExpenseDto) {
    const url = `${this.base}/expenses`;
    return this.http.post(url, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        const msg =
          (Array.isArray(err.error?.message)
            ? err.error.message.join(', ')
            : err.error?.message) ||
          err.message ||
          'Expense creation failed';
        return throwError(() => ({ ...err, friendlyMessage: msg }));
      })
    );
  }

  respondLate(
    expenseId: number,
    groupId: number,
    status: 'accepted' | 'declined'
  ) {
    return this.http.patch(
      `${this.base}/expenses/${expenseId}/respond-late/${groupId}`,
      { status }
    );
  }
}
