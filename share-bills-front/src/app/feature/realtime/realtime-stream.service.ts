import { inject, Injectable } from '@angular/core';
import {
  isType,
  type PendingExpenseEvent as PendingEvent,
  type RealtimeEventType,
  type UserEvent,
} from './realtime-events';
import { Store } from '@ngrx/store';
import { TokenState } from '../../core/auth/token.state';
import {
  filter,
  from,
  map,
  mergeMap,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { selectUser } from '../../core/auth/state/auth.selectors';
import { environment } from '../../../environment/environment';
import { sse$ } from '../../core/sse/sse.utils';
import { withBackoff } from '../../core/sse/sse.backoff';

@Injectable({ providedIn: 'root' })
export class RealtimeStreamService {
  private store = inject(Store);
  private auth = inject(TokenState);

  private events$?: Observable<UserEvent>;
  private shownPending = new Set<number>();
  private markShown$ = new Subject<number>();

  connect(): Observable<UserEvent> {
    //if events$ is already connected, return it
    if (this.events$) return this.events$;

    this.events$ = this.store.select(selectUser).pipe(
      filter((u) => !!u?.id),
      take(1),
      switchMap((u) => {
        const token =
          this.auth.accessToken?.() ?? localStorage.getItem('access_token');
        if (!token) {
          return new Observable<UserEvent>();
        }
        const url = `${environment.apiUrl}/realtime/stream?userId=${u?.id}`;
        const names: RealtimeEventType[] = [
          'open',
          'heartbeat',
          'expense.pending',
          'expense.responded',
          'expense.transferred',
          'expense.finalized',
        ];
        return sse$<any>(url, { events: names, heartbeatMs: 20000 }).pipe(
          withBackoff(5, 1000) // Retry up to 5 times with exponential backoff
        );
      }),

      mergeMap((msg) => (Array.isArray(msg) ? from(msg) : of(msg))),
      map((m: any): UserEvent | null => {
        //check if the message is a valid event (has a type and data)
        const t =
          m?.type ??
          m?.event ??
          (typeof m === 'object' && typeof m.data?.type === 'string'
            ? m.data.type
            : undefined);

        //if the message is not a valid event, return null
        if (!t) return null;

        return {
          type: t as RealtimeEventType,
          data: m?.data ?? m,
        };
      }),
      filter((e): e is UserEvent => !!e?.type && 'data' in e),
      shareReplay({ refCount: true, bufferSize: 1 })
    );

    this.markShown$.subscribe((id) => this.shownPending.add(id));
    return this.events$;
  }

  pending$(): Observable<PendingEvent> {
    return this.connect().pipe(
      filter(isType('expense.pending')),
      map((e) => e.data),
      filter((p) => (p.me?.status ?? 'pending') === 'pending'),
      filter((p) => !this.shownPending.has(p.expense.id)),
      tap((p) => {
      }),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }

  responded$() {
    return this.connect().pipe(
      filter(isType('expense.responded')),
      map((e) => e.data),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }

  transferred$() {
    return this.connect().pipe(
      filter(isType('expense.transferred')),
      map((e) => e.data),
      tap((e) => {
      }),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }

  finalized$() {
    return this.connect().pipe(
      filter(isType('expense.finalized')),
      map((e) => e.data),
      tap((e) => {
      }),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }

  markPendingDialogShown(expenseId: number) {
    this.markShown$.next(expenseId);
  }

  countdown$(expenseId: number) {
    const url = environment.apiUrl + `/expenses/${expenseId}/countdown`;
    return sse$<{ msLeft: number; finalized: boolean }>(url).pipe(
      withBackoff(10, 500),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }
}
