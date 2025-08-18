import { Module } from '@nestjs/common';
import { ExpenseParticipantsService } from './expense-participants.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseParticipant } from './expense-participants.entity';
import { Expense } from '../expenses/expense.entity';
import { ExpensesService } from '../expenses/expenses.service';
import { GroupMembersBalanceService } from '../group-members-balance/group-members-balance.service';
import { GroupMemberBalance } from '../group-members-balance/group-members-balance.entity';
import { ExpenseFinalizerService } from '../expenses/expense.finalizer.service';
import { GroupMembersService } from '../group-members/group-members.service';
import { GroupMember } from '../group-members/group-members.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpenseParticipant, Expense, GroupMemberBalance, GroupMember])
  ],
  providers: [
    ExpenseParticipantsService,
    ExpensesService,
    GroupMembersBalanceService,
    ExpenseFinalizerService,
    GroupMembersService,
  ],
  exports: [ExpenseParticipantsService],
})
export class ExpenseParticipantsModule {}
