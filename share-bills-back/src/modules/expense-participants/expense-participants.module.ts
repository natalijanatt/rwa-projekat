import { Module } from '@nestjs/common';
import { ExpenseParticipantsService } from './expense-participants.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseParticipant } from './expense-participants.entity';
import { Expense } from '../expenses/expense.entity';
import { ExpensesService } from '../expenses/expenses.service';
import { GroupMembersBalanceService } from '../group-members-balance/group-members-balance.service';
import { GroupMemberBalance } from '../group-members-balance/group-members-balance.entity';
import { ExpenseFinalizerService } from '../expenses/expense.finalizer.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseParticipant, Expense, GroupMemberBalance])],
  providers: [ExpenseParticipantsService, ExpensesService, GroupMembersBalanceService, ExpenseFinalizerService],
  exports: [ExpenseParticipantsService]
})
export class ExpenseParticipantsModule {}
