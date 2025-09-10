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
  Sse,
  UseGuards,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';

import { ExpensesService } from './expenses.service';
import { ExpenseParticipantsService } from '../expense-participants/expense-participants.service';
import { GroupsService } from '../groups/groups.service';
import { GroupMembersService } from '../group-members/group-members.service';
import { StorageService } from '../storage/storage.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { BaseExpenseDto } from './dto/base-expense.dto';
import { FullExpenseDto } from './dto/full-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { PaginatedExpenses } from './dto/paginated-expenses.dto';
import {
  ExpenseParticipant,
  ParticipantStatus,
} from '../expense-participants/expense-participants.entity';
import { UserEventBus } from 'src/realtime/user-event.bus';
import { TxnType } from './expense.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


type RespondDto = { status: ParticipantStatus };
type MessageEvent = { data: any; event?: string };

@ApiTags('Expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly expenseParticipantsService: ExpenseParticipantsService,
    private readonly groupsService: GroupsService,
    private readonly groupMembersService: GroupMembersService,
    private readonly bus: UserEventBus,
    private readonly storage: StorageService,
  ) {}

  // ---------- STATIC / NON-PARAM ROUTES FIRST ----------

  @UseGuards(JwtAuthGuard)
  @Get()
  async getExpenses(
    @CurrentUser() userId: number,
    @Query() filter: FilterExpenseDto,
  ): Promise<PaginatedExpenses> {
    return this.expensesService.getExpenses(filter, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('missed')
  async getMissedExpenses(@CurrentUser() userId: number): Promise<BaseExpenseDto[]> {
    return this.expenseParticipantsService.findMissedExpensesForUser(userId);
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

  @UseGuards(JwtAuthGuard)
  @Get('group/:groupId')
  async getExpensesForGroup(
    @CurrentUser() userId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('page') page: number = 1,
  ): Promise<BaseExpenseDto[]> {
    const validated = await this.groupsService.checkMembership(userId, groupId);
    if (!validated) {
      throw new ForbiddenException('Not a member of this group');
    }
    return this.expensesService.getExpensesForGroup(groupId, +page);
  }

  @UseGuards(JwtAuthGuard)
  @Get('group/:groupId/:expenseId')
  async getExpenseInGroup(
    @CurrentUser() userId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
  ): Promise<FullExpenseDto> {
    const validated = await this.groupsService.checkMembership(userId, groupId);
    if (!validated) {
      throw new ForbiddenException('Not a member of this group');
    }

    const expense = await this.expensesService.getExpense(expenseId);
    if (expense.groupId !== groupId) {
      throw new ForbiddenException('Expense does not belong to this group');
    }

    // Process paidBy user image
    if (expense.paidBy?.user?.imagePath) {
      expense.paidBy.user.imagePath = this.storage.getPublicUrl(expense.paidBy.user.imagePath);
    }

    // Process participants user images
    if (expense.participants) {
      expense.participants = expense.participants.map(participant => ({
        ...participant,
        user: {
          ...participant.user,
          imagePath: participant.user.imagePath 
            ? this.storage.getPublicUrl(participant.user.imagePath)
            : undefined
        }
      }));
    }

    return expense as FullExpenseDto;
  }

  // ---------- CREATE / MUTATIONS ----------

  @UseGuards(JwtAuthGuard)
  @Post()
  async createExpense(
    @CurrentUser() userId: number,
    @Body() dto: CreateExpenseDto,
  ) {
    const member = await this.groupMembersService.getMemberByUserId(
      dto.groupId,
      userId,
    );
    if (!member) {
      throw new BadRequestException('Not a member of this group');
    }

    const exp = await this.expensesService.create(dto, member.id);

    if (exp.txnType === TxnType.TRANSFER) {
      await this.expenseParticipantsService.notifyReciever(exp.id);
    }

    return exp;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':expenseId/respond/:memberId')
  async respond(
    @CurrentUser() userId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: RespondDto,
  ) {
    const ok = await this.expenseParticipantsService.checkParticipant(
      expenseId,
      userId,
      memberId,
    );
    const member = await this.groupMembersService.findOne(memberId);
    if (!ok || !member) {
      throw new ForbiddenException('Not a participant of this expense');
    }

    if (dto.status !== ParticipantStatus.Accepted && dto.status !== ParticipantStatus.Declined) {
      throw new BadRequestException('status must be accepted|declined');
    }
    return this.expenseParticipantsService.respond(expenseId, member, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':expenseId/respond-late/:groupId')
  async respondLate(
    @CurrentUser() userId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: RespondDto,
  ) {
    const member = await this.groupMembersService.getMemberByUserId(groupId, userId);
    if (!member) {
      throw new BadRequestException('Not a member of this group');
    }

    const ok = await this.expenseParticipantsService.checkParticipant(
      expenseId,
      userId,
      member.id,
    );
    if (!ok) {
      throw new ForbiddenException('Not a participant of this expense');
    }

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
      paidByName: p.expense.paidBy?.user.name || 'Loading...',
      groupName: p.expense?.group?.name || 'Loading...',
      me: {
        memberId: p.memberId,
        status: p.status ?? ParticipantStatus.Pending,
      },
    };
  }
}
