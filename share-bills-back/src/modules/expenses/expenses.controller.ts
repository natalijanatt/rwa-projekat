import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpenseParticipantsService } from '../expense-participants/expense-participants.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from '../groups/groups.service';
import { GroupMembersService } from '../group-members/group-members.service';
import {
  ExpenseParticipant,
  ParticipantStatus,
} from '../expense-participants/expense-participants.entity';
import { PendingExpenseBus } from 'src/realtime/pending-expense.bus';
import { concatMap, from, interval, map, merge, Observable, tap } from 'rxjs';
import { PendingExpenseEvent } from './dto/pending-expense-event';
import type { Response } from 'express';

type RespondDto = { status: ParticipantStatus };

@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly expenseParticipantsService: ExpenseParticipantsService,
    private readonly groupsService: GroupsService,
    private readonly groupMembersService: GroupMembersService,
    private readonly bus: PendingExpenseBus,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createExpense(
    @Req() req: Request & { user: { userId: number } },
    @Body() dto: CreateExpenseDto,
  ) {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'You have to be logged in to create an expense',
      );
    }

    const member = await this.groupMembersService.getMemberByUserId(
      dto.groupId,
      userId,
    );
    if (!member) {
      throw new BadRequestException('You are not a member of this group');
    }

    return this.expensesService.create(dto, member.id);
  }

  @Get('countdown/:expenseId')
  @Sse()
  countdown(@Param('expenseId', ParseIntPipe) expenseId: number) {
    return this.expenseParticipantsService.countdown(expenseId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':expenseId/respond/:memberId')
  async respond(
    @Req() req: Request & { user: { userId: number } },
    @Param('expenseId', ParseIntPipe) expenseId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: RespondDto,
  ) {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'You have to be logged in to respond to an expense',
      );
    }
    const validateParticipant =
      await this.expenseParticipantsService.checkParticipant(
        expenseId,
        userId,
        memberId,
      );
    if (!validateParticipant) {
      throw new BadRequestException(
        'You are not a participant of this expense',
      );
    }
    if (
      dto.status.toString() !== 'accepted' &&
      dto.status.toString() !== 'declined'
    ) {
      throw new BadRequestException('status must be accepted|declined');
    }
    return this.expenseParticipantsService.respond(
      expenseId,
      memberId,
      dto.status,
    );
  }

  // @UseGuards(AuthGuard('jwt'))
  @Sse('expense-stream')
  expenseStream(
    @Query('userId') userId: number,
  ): Observable<{ data: PendingExpenseEvent }> {
    const backlog$ = from(
      this.expenseParticipantsService.findPendingEventsForUser(userId),
    ).pipe(
      concatMap((rows) => from(rows)),
      tap(row => console.log('[SSE row]', row)),
      map((row) => this.toPendingEvent(row)),
    );

  //   const heartbeat$ = interval(15000).pipe(
  //   map(() => ({ type: 'heartbeat', data: null } as MessageEvent))
  // );

    // 2) live stream
    const live$ = this.bus.forUser$(userId);

    // 3) merge + shape as SSE
    return merge(backlog$, live$).pipe(
      map((data) => ({ data }) as MessageEvent),
    );
  }

  private toPendingEvent(p: ExpenseParticipant): PendingExpenseEvent {
    return {
      type: 'pending-expense',
      expense: {
        id: p.expenseId ?? p.expense?.id,
        title: p.expense?.title ?? '(loading...)',
        amount: p.expense?.amount ?? 0,
        groupId: p.groupId ?? p.expense?.groupId,
        paidById: p.expense?.paidById ?? 0,
      },
      me: {
        memberId: p.memberId,
        status: p.status ?? ParticipantStatus.Pending,
      },
    };
  }
}
