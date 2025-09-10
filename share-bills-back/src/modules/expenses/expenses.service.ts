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
import { BaseService } from '../../common/services/base.service';
import { ExpenseNotFoundException } from '../../common/exceptions/business.exceptions';
import { PAGINATION, COMMON_SELECT_FIELDS, getSelectFields } from '../../common/constants/pagination.constants';

@Injectable()
export class ExpensesService extends BaseService<Expense> {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    private readonly groupMembersBalanceService: GroupMembersBalanceService,
    private readonly groupMembersService: GroupMembersService,
    @Inject(forwardRef(() => ExpenseFinalizerService))
    private readonly finalizer: ExpenseFinalizerService,
  ) {
    super(expenseRepo);
  }

  async findOne(id: number): Promise<Expense> {
    const expense = await this.expenseRepo.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('paidBy.user', 'paidByUser')
      .leftJoinAndSelect('expense.paidTo', 'paidTo')
      .leftJoinAndSelect('paidTo.user', 'paidToUser')
      .addSelect(getSelectFields('group', COMMON_SELECT_FIELDS.GROUP))
      .where('expense.id = :id', { id })
      .getOne();
    
    if (!expense) {
      throw new ExpenseNotFoundException(id);
    }
    
    return expense;
  }

  async getExpensesForGroup(
    groupId: number,
    page: number = 1,
  ): Promise<BaseExpenseDto[]> {
    const qb = this.createBaseQueryBuilder('expense')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .where('expense.groupId = :groupId', { groupId });
    
    this.applyPagination(qb, { 
      page, 
      limit: PAGINATION.USER_SEARCH_LIMIT, 
      orderBy: 'createdAt', 
      orderDirection: 'DESC' 
    });

    const expenses = await qb.getMany();
    return expenses.map((expense) => new BaseExpenseDto(expense));
  }
  async getExpenses(
    filter: FilterExpenseDto,
    userId: number,
  ): Promise<PaginatedExpenses> {
    const page = Math.max(filter.page ?? 1, 1);

    const qb = this.createBaseQueryBuilder('expense')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('paidBy.user', 'paidByUser')
      .leftJoinAndSelect('expense.paidTo', 'paidTo')
      .leftJoinAndSelect('paidTo.user', 'paidToUser')
      .leftJoinAndSelect('expense.participants', 'participants')
      .leftJoinAndSelect('participants.member', 'participantMember')
      .leftJoinAndSelect('participantMember.user', 'participantUser')
      .distinct(true);

    if (filter.groupId) {
      qb.andWhere('expense.groupId = :groupId', { groupId: filter.groupId });
    }
    if (userId) {
      qb.andWhere('participantUser.id = :userId', { userId });
    }
    if (filter.type) {
      qb.andWhere('expense.txnType = :type', { type: filter.type });
    }
    if (filter.status) {
      qb.andWhere('participants.status = :status', { status: filter.status });
    }
    if (filter.paidBy) {
      qb.andWhere('expense.paidBy = :paidBy', { paidBy: filter.paidBy });
    }

    this.applyPagination(qb, {
      page,
      limit: PAGINATION.EXPENSE_PAGE_SIZE,
      orderBy: filter.ordredBy || 'createdAt',
      orderDirection: filter.orderDirection || 'DESC'
    });

    const [entities, totalItems] = await qb.getManyAndCount();
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / PAGINATION.EXPENSE_PAGE_SIZE);

    return {
      items: entities.map((e) => new BaseExpenseDto(e)),
      page,
      pageSize: PAGINATION.EXPENSE_PAGE_SIZE,
      totalItems,
      totalPages,
    };
  }

  async getExpense(expenseId: number): Promise<FullExpenseDto> {
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
      .addSelect(getSelectFields('paidByUser', COMMON_SELECT_FIELDS.USER))
      .addSelect(getSelectFields('paidToUser', COMMON_SELECT_FIELDS.USER))
      .addSelect(getSelectFields('participantUser', COMMON_SELECT_FIELDS.USER))

      .where('expense.id = :expenseId', { expenseId })
      .getOne();

    if (!expense) {
      throw new ExpenseNotFoundException(expenseId);
    }

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
      dateIncurred: data.dateIncurred,
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
