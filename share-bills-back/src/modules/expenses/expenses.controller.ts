import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Sse } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpenseParticipantsService } from '../expense-participants/expense-participants.service';

type RespondDto = { status: 'accepted' | 'declined' };

@Controller('expenses')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService,
        private readonly expenseParticipantsService: ExpenseParticipantsService
    ) {}

    @Get('countdown/:expenseId')
    @Sse()
    countdown(@Param('id', ParseIntPipe) expenseId: number) {
        return this.expenseParticipantsService.countdown(expenseId);
    }

    @Patch(':expenseId/respond/:memberId')
    async respond(
        @Param('expenseId', ParseIntPipe) expenseId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Body() dto: RespondDto
    ) {
        if (dto.status !== 'accepted' && dto.status !== 'declined') {
      throw new BadRequestException('status must be accepted|declined');
    }
        return this.expenseParticipantsService.respond(expenseId, memberId, dto.status);
    }
}
