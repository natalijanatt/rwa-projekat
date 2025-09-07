import { Module, forwardRef } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './expense.entity';
import { ExpenseParticipant } from '../expense-participants/expense-participants.entity';
import { GroupMember } from '../group-members/group-members.entity';
import { Group } from '../groups/group.entity';
import { User } from '../users/user.entity';
import { GroupMemberBalance } from '../group-members-balance/group-members-balance.entity';
import { ExpenseFinalizerService } from './expense.finalizer.service';

import { ExpenseParticipantsModule } from '../expense-participants/expense-participants.module';
import { GroupsModule } from '../groups/groups.module';
import { GroupMembersModule } from '../group-members/group-members.module';
import { UsersModule } from '../users/users.module';
import { GroupMembersBalanceModule } from '../group-members-balance/group-members-balance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      ExpenseParticipant,
      GroupMember,
      Group,
      User,
      GroupMemberBalance,
    ]),
    forwardRef(() => ExpenseParticipantsModule),
    GroupsModule,
    GroupMembersModule,
    UsersModule,
    GroupMembersBalanceModule,
  ],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    ExpenseFinalizerService,
  ],
  exports: [
    ExpensesService,
    ExpenseFinalizerService,
  ],
})
export class ExpensesModule {}