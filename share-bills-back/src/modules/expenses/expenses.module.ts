import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './expense.entity';
import { ExpenseParticipant } from '../expense-participants/expense-participants.entity';
import { GroupMember } from '../group-members/group-members.entity';
import { ExpenseParticipantsService } from '../expense-participants/expense-participants.service';
import { GroupsService } from '../groups/groups.service';
import { Group } from '../groups/group.entity';
import { GroupMembersService } from '../group-members/group-members.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { GroupMemberBalance } from '../group-members-balance/group-members-balance.entity';
import { GroupMembersBalanceService } from '../group-members-balance/group-members-balance.service';
import { ExpenseFinalizerService } from './expense.finalizer.service';

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
  ],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    ExpenseParticipantsService,
    GroupsService,
    GroupMembersService,
    UsersService,
    GroupMembersBalanceService,
    ExpenseFinalizerService,
  ],
  exports: [
    ExpensesService,
    ExpenseParticipantsService,
    ExpenseFinalizerService,
  ],
})
export class ExpensesModule {}
