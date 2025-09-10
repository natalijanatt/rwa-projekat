import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { UserEvent } from './user-event.types';


@Injectable()
export class UserEventBus implements OnModuleDestroy {
  private streams = new Map<number, Subject<UserEvent>>();

  private ensure(userId: number): Subject<UserEvent> {
    let s = this.streams.get(userId);
    if (!s) {
      s = new Subject<UserEvent>();
      this.streams.set(userId, s);
    }
    return s;
  }

  forUser$(userId: number): Observable<UserEvent> {
    console.log('[BUS] forUser$ subscription for', userId);
    return this.ensure(userId).asObservable();
  }

  emitToUser(userId: number, ev: UserEvent) {
    this.ensure(userId).next(ev);
  }

  emitToUsers(userIds: number[], evFactory: (uid: number) => UserEvent) {
    userIds.forEach((uid) => this.emitToUser(uid, evFactory(uid)));
  }

  onModuleDestroy() {
    this.streams.forEach((s) => s.complete());
    this.streams.clear();
  }
}
