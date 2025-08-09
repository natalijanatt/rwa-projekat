import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense } from './expense.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExpensesService {
    constructor(
        @InjectRepository(Expense)
        private readonly expenseRepo: Repository<Expense>,
    ){}

    async findOne(id: number): Promise<Expense | null> {
        return this.expenseRepo.findOneBy({ id });
    }

    async create(data: Partial<Expense>): Promise<Expense> {
        //! dodaj CreateExpenseDto
        const newExpense = this.expenseRepo.create(data);
        return this.expenseRepo.save(newExpense);
    }
}
