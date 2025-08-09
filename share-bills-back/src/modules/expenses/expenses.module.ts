import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './expense.entity';
import { ExpenseParticipant } from '../expense-participants/expense-participants.entity';
import { GroupMember } from '../group-members/group-members.entity';
import { ExpenseParticipantsService } from '../expense-participants/expense-participants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, ExpenseParticipant, GroupMember])],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseParticipantsService],
  exports: [ExpensesService, ExpenseParticipantsService]
})
export class ExpensesModule {}
