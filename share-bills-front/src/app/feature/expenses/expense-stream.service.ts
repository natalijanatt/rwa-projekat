import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenState } from '../../core/auth/token.state';
import { sse$ } from '../../core/sse/sse.utils';
import { withBackoff } from '../../core/sse/sse.backoff';
import {
  Observable,
  Subject,
  Subscription,
  filter,
  from,
  map,
  mergeMap,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { environment } from '../../../environment/environment';
import { Store } from '@ngrx/store';
import { selectUser } from '../../core/auth/state/auth.selectors';
import { UserDto } from '../users/data/user.dto';

export interface PendingExpenseEvent {
  type: 'pending-expense';
  expense: {
    id: number;
    title: string;
    amount: number;
    groupId: number;
    paidById: number;
  };
  me: { memberId: number; status: 'pending' | 'accepted' | 'declined' | null };
}

export interface CountdownTick {
  expenseId: number;
  remainingSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class ExpenseStreamService {
  private http = inject(HttpClient);
  private auth = inject(TokenState);
  private store = inject(Store);
  pending$: Observable<PendingExpenseEvent> | null = null;

  // Local bus to prevent duplicate dialogs per expenseId
  private shown = new Set<number>();
  private markShown$ = new Subject<number>();

connect(): Observable<PendingExpenseEvent> {
  if (this.pending$) return this.pending$ as Observable<PendingExpenseEvent>;

  this.pending$ = this.store.select(selectUser).pipe(
    filter((u): u is UserDto => !!u?.id),
    take(1),
    switchMap(u => {
      const token = this.auth.accessToken?.() ?? localStorage.getItem('access_token');
      if (!token) {
        console.error('[SSE] No token available');
        return new Observable<any>();
      }
      const url = `${environment.apiUrl}/expenses/expense-stream?userId=${u.id}`;
      console.log('[SSE] connect URL =', url);
      return sse$<any>(url);
    }),

    // raw log (if you don't see this, the connection isn't delivering JSON)
    tap(msg => console.log('[SSE raw]', msg)),
    filter(msg => msg && msg.type !== 'heartbeat'),
    // server sometimes sends arrays -> flatten
    mergeMap(msg => Array.isArray(msg) ? from(msg) : of(msg)),

    tap(row => console.log('[SSE row]', row)),

    // map participant row -> PendingExpenseEvent (placeholders for now)
    map((p): PendingExpenseEvent => ({
      type: 'pending-expense',
      expense: {
        id: p.expense.id ?? 0,
        title: p.expense?.title ?? '(loading...)',
        amount: p.expense?.amount ?? 0,
        groupId: p.expense.groupId ?? 0,
        paidById: p.expense?.paidById ?? 0,
      },
      me: { memberId: p.me.memberId, status: p.me.status ?? 'pending' },
    })),

    tap(ev => console.log('[SSE mapped]', ev)),
    // only show if still pending & not already shown
    filter(e => (e.me?.status ?? 'pending') === 'pending'),
    filter(e => !this.shown.has(e.expense.id)),

    shareReplay({ refCount: true, bufferSize: 1 }),
  ) as Observable<PendingExpenseEvent>;

  this.markShown$.subscribe(id => this.shown.add(id));
  return this.pending$;
}


  markDialogShown(expenseId: number) {
    this.markShown$.next(expenseId);
  }

  // Countdown stream per expense
  countdown$(expenseId: number): Observable<any> {
    const url = environment.apiUrl + `/expenses/countdown/${expenseId}`;
    return sse$<{ msLeft: number; finalized: boolean }>(url).pipe(
      withBackoff(10, 500),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }

  // API calls
  getMyReview(expenseId: number) {
    return this.http.get<{
      status: 'accepted' | 'declined' | null;
      expense: any;
    }>(`${environment.apiUrl}/expenses/${expenseId}/my-review`);
  }

  respond(
    expenseId: number,
    memberId: number,
    status: 'accepted' | 'declined'
  ) {
    return this.http.patch(
      `${environment.apiUrl}/expenses/${expenseId}/respond/${memberId}`,
      { status }
    );
  }
}
