import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { ParticipantStatus } from '../expense-participants/expense-participants.entity';

type RespondDto = { status: ParticipantStatus };

@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly expenseParticipantsService: ExpenseParticipantsService,
    private readonly groupsService: GroupsService,
    private readonly groupMembersService: GroupMembersService,
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
      await this.expenseParticipantsService.checkParticipant(expenseId, userId, memberId);
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
}
