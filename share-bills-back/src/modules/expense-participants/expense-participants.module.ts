import { Module, forwardRef} from '@nestjs/common';
import { ExpenseParticipantsService } from './expense-participants.service';
import { ExpenseParticipantsController } from './expense-participants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseParticipant } from './expense-participants.entity';
import { Expense } from '../expenses/expense.entity';
import { GroupMemberBalance } from '../group-members-balance/group-members-balance.entity';
import { GroupMember } from '../group-members/group-members.entity';
import { GroupMembersBalanceModule } from '../group-members-balance/group-members-balance.module';
import { GroupMembersModule } from '../group-members/group-members.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { RealtimeModule } from 'src/realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpenseParticipant, Expense, GroupMemberBalance, GroupMember]),
    GroupMembersBalanceModule,
    GroupMembersModule,
    forwardRef(() => RealtimeModule),
    forwardRef(() => ExpensesModule)
  ],
  controllers: [ExpenseParticipantsController],
  providers: [
    ExpenseParticipantsService
  ],
  exports: [ExpenseParticipantsService],
})
export class ExpenseParticipantsModule {}