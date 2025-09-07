import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense, TxnType } from './expense.entity';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { GroupMembersBalanceService } from '../group-members-balance/group-members-balance.service';
import { ExpenseFinalizerService } from './expense.finalizer.service';
import { GroupMembersService } from '../group-members/group-members.service';
import { BaseExpenseDto } from './dto/base-expense.dto';
import { FullExpenseDto } from './dto/full-expense.dto';
import { GroupMember } from '../group-members/group-members.entity';
import { ParticipantStatus } from '../expense-participants/expense-participants.entity';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { PaginatedExpenses } from './dto/paginated-expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    private readonly groupMembersBalanceService: GroupMembersBalanceService,
    private readonly groupMembersService: GroupMembersService,
    @Inject(forwardRef(() => ExpenseFinalizerService))
    private readonly finalizer: ExpenseFinalizerService,
  ) {}

  async findOne(id: number): Promise<Expense | null> {
    return this.expenseRepo.findOneBy({ id });
  }

  async getExpensesForGroup(
    groupId: number,
    page: number = 1,
  ): Promise<BaseExpenseDto[]> {
    const expenses = await this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .where('expense.groupId = :groupId', { groupId })
      .orderBy('expense.createdAt', 'DESC')
      .skip((page - 1) * 5)
      .take(5)
      .getMany();

    return expenses.map((expense) => new BaseExpenseDto(expense));
  }
  async getExpenses(
    filter: FilterExpenseDto,
    userId: number,
  ): Promise<PaginatedExpenses> {
    const PAGE_SIZE = 20;
    const page = Math.max(filter.page ?? 1, 1);

    const qb = this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('paidBy.user', 'paidByUser')
      .leftJoinAndSelect('expense.paidTo', 'paidTo')
      .leftJoinAndSelect('paidTo.user', 'paidToUser')
      .leftJoinAndSelect('expense.participants', 'participants')
      .leftJoinAndSelect('participants.member', 'participantMember')
      .leftJoinAndSelect('participantMember.user', 'participantUser')
      .distinct(true);

    if (filter.groupId)
      qb.andWhere('expense.groupId = :groupId', { groupId: filter.groupId });
    if (userId) {
      qb.andWhere('participantUser.id = :userId', {
        userId: userId,
      });
    }
    if (filter.type) {
      qb.andWhere('expense.txnType = :type', { type: filter.type });
    }
    if (filter.status) {
      qb.andWhere('participants.status = :status', { status: filter.status });
    }

    if (filter.paidBy) {
      console.log('filter.paidBy', filter.paidBy);
      qb.andWhere('expense.paidBy = :paidBy', { paidBy: filter.paidBy });
    }

    if (filter.ordredBy) {
      qb.orderBy(`expense.${filter.ordredBy}`, filter.orderDirection ?? 'DESC');
    } else {
      qb.orderBy('expense.createdAt', 'DESC');
    }

    qb.skip((page - 1) * PAGE_SIZE).take(PAGE_SIZE);

    const [entities, totalItems] = await qb.getManyAndCount();

    const pageSize = PAGE_SIZE;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

    return {
      items: entities.map((e) => new BaseExpenseDto(e)),
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  async getExpense(expenseId: number): Promise<FullExpenseDto | null> {
    const expense = await this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.group', 'group')

      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('paidBy.user', 'paidByUser')
      .leftJoinAndSelect('expense.paidTo', 'paidTo')
      .leftJoinAndSelect('paidTo.user', 'paidToUser')

      .leftJoinAndSelect(
        'expense.participants',
        'participants',
        'participants.status = :status',
        { status: ParticipantStatus.Accepted },
      )
      .leftJoinAndSelect('participants.member', 'participantMember')
      .leftJoinAndSelect('participantMember.user', 'participantUser')

      .where('expense.id = :expenseId', { expenseId })
      .getOne();

    if (!expense) return null;

    const acceptedMembers: GroupMember[] = (expense.participants ?? [])
      .map((p) => p.member)
      .filter((m): m is GroupMember => !!m);

    return new FullExpenseDto(expense, acceptedMembers.length, acceptedMembers);
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

    if (data.txnType === 'transfer' && data.paidToId) {
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

    this.finalizer.schedule(
      expense.id,
      new Date(entity.acceptanceDeadline || Date.now() + 5 * 60 * 1000),
    );

    await this.groupMembersService.emitToGroup(expense.groupId, expense);

    return expense;
  }

  async getExpenseCountForUser(userId: number): Promise<number> {
    const count = await this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoin('expense.participants', 'participants')
      .leftJoin('participants.member', 'member')
      .where('member.userId = :userId', { userId })
      .getCount();
    return count;
  }
}
