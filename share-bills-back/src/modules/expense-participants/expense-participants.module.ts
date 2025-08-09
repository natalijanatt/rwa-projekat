import { Module } from '@nestjs/common';
import { ExpenseParticipantsService } from './expense-participants.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseParticipant } from './expense-participants.entity';
import { Expense } from '../expenses/expense.entity';
import { ExpensesService } from '../expenses/expenses.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseParticipant, Expense])],
  providers: [ExpenseParticipantsService, ExpensesService],
  exports: [ExpenseParticipantsService]
})
export class ExpenseParticipantsModule {}
