import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense, TxnType } from './expense.entity';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  async findOne(id: number): Promise<Expense | null> {
    return this.expenseRepo.findOneBy({ id });
  }

  async create(data: CreateExpenseDto, paidById: number): Promise<Expense> {
    const entity = this.expenseRepo.create({
      groupId: data.groupId,
      paidById: paidById,
      paidToId: data.paidToId ?? null,
      title: data.title,
      amount: Number(data.amount),
      dateIncurred: data.dateIncurred, // 'YYYY-MM-DD'
      txnType: data.txnType === 'expense' ? TxnType.EXPENSE : TxnType.TRANSFER,
    });

    return await this.expenseRepo.save(entity);
  }
}
