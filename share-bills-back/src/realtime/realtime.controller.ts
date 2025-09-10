import {
  Controller, Sse, Header, ForbiddenException,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery
} from '@nestjs/swagger';
import { EMPTY, Observable, from, interval, map, catchError, startWith, concatMap, tap, merge } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { UserEventBus } from './user-event.bus';
import { ExpenseParticipantsService } from 'src/modules/expense-participants/expense-participants.service';
import { ExpenseParticipant, ParticipantStatus } from 'src/modules/expense-participants/expense-participants.entity';
import { UserEvent } from './user-event.types';

@ApiTags('Realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly bus: UserEventBus,
    private readonly expenseParticipants: ExpenseParticipantsService,
  ) {}

  @ApiOperation({ 
    summary: 'Realtime stream',
    description: 'Server-sent event stream za realtime notifikacije i heartbeat'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'SSE stream sa notifikacijama',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          description: 'Server-sent event stream'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Neautorizovan pristup' 
  })
  @ApiQuery({ 
    name: 'userId', 
    required: true, 
    description: 'ID korisnika za stream',
    example: 1
  })
  @Sse('stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  stream(
      @Query('userId', ParseIntPipe) userIdFromQuery: number,
    ): Observable<MessageEvent> {
    
        const userId = +userIdFromQuery;
    if (!userId) throw new ForbiddenException('Unauthorized SSE');

    //1. backlog stream - stari pending eventi
    const backlog$ = from(
      this.expenseParticipants.findPendingEventsForUser(userId),
    ).pipe(
      concatMap((rows) => from(rows)),
      map((row) => ({
        type: 'expense.pending',
        data: this.toPendingEvent(row),
      })),
      catchError((err) => {
        console.error('SSE backlog error', err);
        return EMPTY;
      }),
    );

    //2. live stream - novi eventi
    const live$ = this.bus.forUser$(+userId).pipe(
      map((ev: UserEvent) => ({ type: ev.type, data: ev.data })),
      catchError((err) => {
        console.error('SSE live error', err);
        return EMPTY;
      }),
      tap({
        complete: () => console.log(`[SSE] Live stream completed for user ${userId}`),
        error: (err) => console.error(`[SSE] Live stream error for user ${userId}:`, err)
      })
    );

    //3. heartbeat stream - keep connection alive
    const heartbeat$ = interval(20000).pipe(
      map(() => ({ type: 'heartbeat', data: '' })),
      startWith({ type: 'open', data: 'ready' }),
    );

    //4. merge all streams
    return merge(heartbeat$, backlog$, live$);
  }

    private toPendingEvent(p: ExpenseParticipant) {
      return {
        expense: {
          id: p.expenseId ?? p.expense?.id,
          title: p.expense?.title ?? '(loading...)',
          amount: p.expense?.amount ?? 0,
          groupId: p.groupId ?? p.expense?.groupId,
          paidById: p.expense?.paidById ?? 0,
        },
        paidByName: p.expense.paidBy?.user.name || 'Loading...',
        groupName: p.expense?.group?.name || 'Loading...',
        me: {
          memberId: p.memberId,
          status: p.status ?? ParticipantStatus.Pending,
        },
      };
    }
}
