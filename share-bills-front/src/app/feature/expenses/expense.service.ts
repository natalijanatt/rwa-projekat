import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { CreateExpenseDto } from './data/expense-create.dto';
import { catchError, throwError } from 'rxjs';
import { BaseExpenseDto } from './data/expense-base.dto';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getExpensesFromGroup(groupId: number): import('rxjs').Observable<BaseExpenseDto[]> {
    const url = `${this.base}/expenses/${groupId}`;
    return this.http.get<BaseExpenseDto[]>(url).pipe(
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

  getMissedExpenses(){
    const url = `${this.base}/expenses/missed`;
    return this.http.get<BaseExpenseDto[]>(url).pipe(
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
}
