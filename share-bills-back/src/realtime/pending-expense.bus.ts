import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { PendingExpenseEvent } from 'src/modules/expenses/dto/pending-expense-event';

type StreamEvent = PendingExpenseEvent;

@Injectable()
export class PendingExpenseBus implements OnModuleDestroy {
  private streams = new Map<number, Subject<StreamEvent>>();

  constructor() {
    console.log('[BUS] PendingExpenseBus instance created');
  }

  private ensure(userId: number): Subject<StreamEvent> {
    let s = this.streams.get(userId);
    if (!s) {
      s = new Subject<StreamEvent>();
      this.streams.set(userId, s);
    }
    return s;
  }

  forUser$(userId: number): Observable<StreamEvent> {
    console.log('[BUS] forUser$ subscription for', userId);
    return this.ensure(userId).asObservable();
  }

  emitToUser(userId: number, ev: StreamEvent) {
    this.ensure(userId).next(ev);
  }

  emitToUsers(userIds: number[], evFactory: (uid: number) => StreamEvent) {
    userIds.forEach((uid) => this.emitToUser(uid, evFactory(uid)));
  }

  onModuleDestroy() {
    this.streams.forEach((s) => s.complete());
    this.streams.clear();
  }
}
