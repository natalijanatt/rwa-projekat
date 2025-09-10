import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { CreateExpenseDto } from './data/expense-create.dto';
import { catchError } from 'rxjs';
import { ExpenseBaseDto } from './data/expense-base.dto';
import { FullExpenseDto } from './data/expense-full.dto';
import { ExpenseFilterDto } from './data/expense-filter.dto';
import { ExpensePaginatedDto } from './data/expense-paginated.dto';
import { ErrorService } from '../../core/services/error.service';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);
  private base = environment.apiUrl;

  getExpensesFromGroup(groupId: number): import('rxjs').Observable<ExpenseBaseDto[]> {
    const url = `${this.base}/expenses/${groupId}`;
    return this.http.get<ExpenseBaseDto[]>(url).pipe(
      catchError((err) => this.errorService.handleHttpError(err))
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
      catchError((err) => this.errorService.handleHttpError(err))
    );
  }

  getExpense(expenseId: number, groupId: number) {
    const url = `${this.base}/expenses/group/${groupId}/${expenseId}`;
    return this.http.get<FullExpenseDto>(url).pipe(
      catchError((err) => this.errorService.handleHttpError(err))
    );
  }

  getMissedExpenses(){
    const url = `${this.base}/expenses/missed`;
    return this.http.get<ExpenseBaseDto[]>(url).pipe(
      catchError((err) => this.errorService.handleHttpError(err))
    );
  }

  createExpense(dto: CreateExpenseDto) {
    const url = `${this.base}/expenses`;
    return this.http.post(url, dto).pipe(
      catchError((err) => this.errorService.handleHttpError(err))
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
    ).pipe(
      catchError((err) => this.errorService.handleHttpError(err))
    );
  }
  
  respond(
    expenseId: number,
    memberId: number,
    status: 'accepted' | 'declined'
  ) {
    return this.http.patch(
      `${environment.apiUrl}/expenses/${expenseId}/respond/${memberId}`,
      { status }
    ).pipe(
      catchError((err) => this.errorService.handleHttpError(err))
    );
  }
}
