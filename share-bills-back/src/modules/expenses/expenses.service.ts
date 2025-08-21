import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense, TxnType } from './expense.entity';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { GroupMembersBalanceService } from '../group-members-balance/group-members-balance.service';
import { ExpenseFinalizerService } from './expense.finalizer.service';
import { GroupMembersService } from '../group-members/group-members.service';
import { BaseExpenseDto } from './dto/base-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    private readonly groupMembersBalanceService: GroupMembersBalanceService,
    private readonly finalizer: ExpenseFinalizerService,
    private readonly groupMembersService: GroupMembersService,
  ) {}

  async findOne(id: number): Promise<Expense | null> {
    return this.expenseRepo.findOneBy({ id });
  }

  async getExpensesForGroup(groupId: number, page:number = 1): Promise<BaseExpenseDto[]> {
    const expenses = await this.expenseRepo.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .where('expense.groupId = :groupId', { groupId })
      .orderBy('expense.createdAt', 'DESC')
      .skip((page - 1) * 5)
      .take(5)
      .getMany();

    return expenses.map(expense => new BaseExpenseDto(expense));
  }

  async create(data: CreateExpenseDto, paidById: number): Promise<Expense> {
    if (data.txnType === 'transfer') {
        if (!data.paidToId) {
          throw new BadRequestException('paidTo is required for transfers');
        }
        if (data.paidToId === paidById) {
          throw new BadRequestException('Cannot transfer to yourself');
        }
      }
    const entity = this.expenseRepo.create({
      groupId: data.groupId,
      paidById: paidById,
      paidToId: data.paidToId ?? null,
      title: data.title,
      amount: Number(data.amount),
      dateIncurred: data.dateIncurred, // 'YYYY-MM-DD'
      txnType: data.txnType === 'expense' ? TxnType.EXPENSE : TxnType.TRANSFER,
    });

    if(data.txnType === 'transfer' && data.paidToId) {
      entity.finalizedAt = new Date();
      await this.groupMembersBalanceService.transferBalance(
        entity.id,
        entity.amount,
        paidById,
        data.paidToId,
        entity.groupId,
      );
    const expense = await this.expenseRepo.save(entity);
    return expense;
    }
    const expense = await this.expenseRepo.save(entity);

    this.finalizer.schedule(expense.id, new Date(entity.acceptanceDeadline || Date.now() + 5 * 60 * 1000));

    await this.groupMembersService.emitToGroup(expense.groupId, expense);

    return expense;
  }
}
