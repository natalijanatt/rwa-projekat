import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { ExpensesService } from './expenses.service';
import { ExpenseParticipantsService } from '../expense-participants/expense-participants.service';
import { GroupsService } from '../groups/groups.service';
import { GroupMembersService } from '../group-members/group-members.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { BaseExpenseDto } from './dto/base-expense.dto';
import { FullExpenseDto } from './dto/full-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { PaginatedExpenses } from './dto/paginated-expenses.dto';
import {
  ExpenseParticipant,
  ParticipantStatus,
} from '../expense-participants/expense-participants.entity';
import { PendingExpenseBus } from 'src/realtime/pending-expense.bus';

import {
  catchError,
  concatMap,
  EMPTY,
  from,
  interval,
  map,
  merge,
  Observable,
  startWith,
  tap,
} from 'rxjs';

type RespondDto = { status: ParticipantStatus };
type MessageEvent = { data: any; event?: string };

@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly expenseParticipantsService: ExpenseParticipantsService,
    private readonly groupsService: GroupsService,
    private readonly groupMembersService: GroupMembersService,
    private readonly bus: PendingExpenseBus,
  ) {}

  // ---------- STATIC / NON-PARAM ROUTES FIRST ----------

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getExpenses(
    @Req() req: Request & { user: { userId: number } },
    @Query() filter: FilterExpenseDto,
  ): Promise<PaginatedExpenses> {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('Login required');
    return this.expensesService.getExpenses(filter, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('missed')
  async getMissedExpenses(
    @Req() req: Request & { user: { userId: number } },
  ): Promise<BaseExpenseDto[]> {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('Login required');
    return this.expenseParticipantsService.findMissedExpensesForUser(userId);
  }

  // ---------- SSE ROUTES (AUTH VIA COOKIE withCredentials OR ?token=) ----------

  @Sse('expense-stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  expenseStream(
    @Query('userId', ParseIntPipe) userIdFromQuery: number,
  ): Observable<MessageEvent> {
    // Allow either cookie-based auth (req.user) OR JWT in query (?token=)
    const userId = +userIdFromQuery;

    if (!userId || Number.isNaN(+userId)) {
      // If you want to *require* auth for SSE, make this a ForbiddenException
      throw new ForbiddenException('Unauthorized SSE');
    }

    const backlog$ = from(
      this.expenseParticipantsService.findPendingEventsForUser(+userId),
    ).pipe(
      concatMap((rows) => from(rows)),
      tap((row) => console.log('[SSE backlog row]', row)),
      map((row) => ({ event: 'expense.pending', data: this.toPendingEvent(row) })),
      catchError((err) => {
        console.error('SSE backlog error', err);
        return EMPTY;
      }),
    );

    const live$ = this.bus.forUser$(+userId).pipe(
      map((ev) => ({ event: ev.type ?? 'expense.event', data: ev })),
      catchError((err) => {
        console.error('SSE live error', err);
        return EMPTY;
      }),
    );

    const heartbeat$ = interval(15000).pipe(
      map(() => ({ event: 'heartbeat', data: '💓' })),
      startWith({ event: 'open', data: 'ready' }),
    );

    return merge(heartbeat$, backlog$, live$);
  }

  @Sse(':expenseId/countdown')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  countdown(
    @Param('expenseId', ParseIntPipe) expenseId: number,
  ) {
    return this.expenseParticipantsService.countdown(expenseId);
  }

  // ---------- GROUP-SCOPED READ ROUTES ----------

  @UseGuards(AuthGuard('jwt'))
  @Get('group/:groupId')
  async getExpensesForGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('page') page: number = 1,
    @Req() req: Request & { user: { userId: number } },
  ): Promise<BaseExpenseDto[]> {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('Login required');
    const validated = await this.groupsService.checkMembership(userId, groupId);
    if (!validated) throw new ForbiddenException('Not a member of this group');
    return this.expensesService.getExpensesForGroup(groupId, +page);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('group/:groupId/:expenseId')
  async getExpenseInGroup(
    @Req() req: Request & { user: { userId: number } },
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
  ): Promise<FullExpenseDto | null> {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('Login required');

    const validated = await this.groupsService.checkMembership(userId, groupId);
    if (!validated) throw new ForbiddenException('Not a member of this group');

    const expense = await this.expensesService.getExpense(expenseId);
    if (!expense) throw new BadRequestException('Expense not found');
    if (expense.groupId !== groupId) {
      throw new ForbiddenException('Expense does not belong to this group');
    }
    return expense;
  }

  // ---------- CREATE / MUTATIONS ----------

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createExpense(
    @Req() req: Request & { user: { userId: number } },
    @Body() dto: CreateExpenseDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('Login required');

    const member = await this.groupMembersService.getMemberByUserId(
      dto.groupId,
      userId,
    );
    if (!member) throw new BadRequestException('Not a member of this group');

    return this.expensesService.create(dto, member.id);
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
    if (!userId) throw new ForbiddenException('Login required');

    const ok = await this.expenseParticipantsService.checkParticipant(
      expenseId,
      userId,
      memberId,
    );
    if (!ok) throw new ForbiddenException('Not a participant of this expense');

    if (dto.status !== ParticipantStatus.Accepted && dto.status !== ParticipantStatus.Declined) {
      throw new BadRequestException('status must be accepted|declined');
    }
    return this.expenseParticipantsService.respond(expenseId, memberId, dto.status);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':expenseId/respond-late/:groupId')
  async respondLate(
    @Req() req: Request & { user: { userId: number } },
    @Param('expenseId', ParseIntPipe) expenseId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: RespondDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('Login required');

    const member = await this.groupMembersService.getMemberByUserId(groupId, userId);
    if (!member) throw new BadRequestException('Not a member of this group');

    const ok = await this.expenseParticipantsService.checkParticipant(
      expenseId,
      userId,
      member.id,
    );
    if (!ok) throw new ForbiddenException('Not a participant of this expense');

    if (dto.status !== ParticipantStatus.Accepted && dto.status !== ParticipantStatus.Declined) {
      throw new BadRequestException('status must be accepted|declined');
    }
    try {
      return await this.expenseParticipantsService.participateInExpense(
        expenseId,
        member.id,
        dto.status,
      );
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw e;
    }
  }

  // ---------- helpers ----------

  // private tryVerifyToken(token?: string): { userId: number } | null {
  //   if (!token) return null;
  //   try {
  //     const payload = this.jwt.verify(token); // same secret as your Bearer strategy
  //     // adjust if your JWT stores different claim names
  //     return { userId: payload.sub ?? payload.userId ?? payload.id };
  //   } catch {
  //     return null;
  //   }
  // }

  private toPendingEvent(p: ExpenseParticipant) {
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
