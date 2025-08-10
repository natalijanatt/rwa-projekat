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

@Module({
  imports: [TypeOrmModule.forFeature([Expense, ExpenseParticipant, GroupMember, Group, User])],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseParticipantsService, GroupsService, GroupMembersService, UsersService],
  exports: [ExpensesService, ExpenseParticipantsService]
})
export class ExpensesModule {}
