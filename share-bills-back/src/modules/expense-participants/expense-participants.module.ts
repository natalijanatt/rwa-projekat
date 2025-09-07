import { Module} from '@nestjs/common';
import { ExpenseParticipantsService } from './expense-participants.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseParticipant } from './expense-participants.entity';
import { Expense } from '../expenses/expense.entity';
import { GroupMemberBalance } from '../group-members-balance/group-members-balance.entity';
import { GroupMember } from '../group-members/group-members.entity';

import { GroupMembersBalanceModule } from '../group-members-balance/group-members-balance.module';
import { GroupMembersModule } from '../group-members/group-members.module';
import { ExpenseFinalizerService } from '../expenses/expense.finalizer.service';
import { ExpensesService } from '../expenses/expenses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpenseParticipant, Expense, GroupMemberBalance, GroupMember]),
    GroupMembersBalanceModule,
    GroupMembersModule,

  ],
  providers: [
    ExpenseParticipantsService, ExpenseFinalizerService, ExpensesService
  ],
  exports: [ExpenseParticipantsService],
})
export class ExpenseParticipantsModule {}