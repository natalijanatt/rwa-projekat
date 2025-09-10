import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExpenseParticipant,
  ParticipantStatus,
} from './expense-participants.entity';
import { from, switchMap, timer } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { ExpensesService } from '../expenses/expenses.service';
import { Expense, TxnType } from '../expenses/expense.entity';
import { GroupMembersBalanceService } from '../group-members-balance/group-members-balance.service';
import { ExpenseFinalizerService } from '../expenses/expense.finalizer.service';
import { BaseExpenseDto } from '../expenses/dto/base-expense.dto';
import { UserEventBus } from 'src/realtime/user-event.bus';
import { UserEvent } from 'src/realtime/user-event.types';
import { ResponseExpenseEvent } from 'src/realtime/dtos/response-expense-event';
import { FinalizedExpenseEvent } from 'src/realtime/dtos/finalized-expense-event';
import { GroupMember } from '../group-members/group-members.entity';

@Injectable()
export class ExpenseParticipantsService {
  constructor(
    @InjectRepository(ExpenseParticipant)
    private readonly repo: Repository<ExpenseParticipant>,
    @Inject(forwardRef(() => ExpensesService))
    private readonly expenseService: ExpensesService,
    private readonly groupMembersBalanceService: GroupMembersBalanceService,
    @Inject(forwardRef(() => ExpenseFinalizerService))
    private readonly finalizer: ExpenseFinalizerService,
    private readonly bus: UserEventBus,
  ) {}

  async checkParticipant(expenseId: number, userId: number, memberId: number) {
    const participant = await this.repo
      .createQueryBuilder('p')
      .innerJoin('p.member', 'member')
      .innerJoin('member.user', 'user')
      .where('p.expense_id = :expenseId', { expenseId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!participant || participant?.memberId !== memberId) {
      return false;
    }
    return true;
  }

  countdown(expenseId: number) {
    return timer(0, 1000).pipe(
      switchMap(() => from(this.expenseService.findOne(expenseId))),
      map((expense: Expense | null) => {
        if (!expense) return { data: { msLeft: 0, finalized: true } };

        const deadlineMs = new Date(expense.acceptanceDeadline).getTime();
        const msLeft = Math.max(0, deadlineMs - Date.now());
        const finalized = Boolean(expense.finalizedAt) || msLeft <= 0;

        return { data: { msLeft, finalized } } as {
          data: { msLeft: number; finalized: boolean };
        };
      }),
      takeWhile((evt) => !evt.data.finalized, true),
    );
  }

  private async finalizeCore(
    manager: import('typeorm').EntityManager,
    exp: Expense,
    opts: { declinePendingBeforeFinalize: boolean },
  ): Promise<{ finalized: true; expenseId: number; groupId: number; acceptedCount: number }> {
    const expenseRepo = manager.getRepository(Expense);
    const participantRepo = manager.getRepository(ExpenseParticipant);

    if (opts.declinePendingBeforeFinalize) {
      await participantRepo
        .createQueryBuilder()
        .update(ExpenseParticipant)
        .set({ status: ParticipantStatus.Declined })
        .where('expense_id = :expenseId', { expenseId: exp.id })
        .andWhere('status = :pending', { pending: ParticipantStatus.Pending })
        .execute();
    }

    const acceptedRows: { memberId: number }[] = await participantRepo
      .createQueryBuilder('p')
      .select('p.member_id', 'memberId')
      .where('p.expense_id = :expenseId', { expenseId: exp.id })
      .andWhere('p.status = :status', { status: ParticipantStatus.Accepted })
      .andWhere('p.member_id <> :payerId', { payerId: exp.paidById })
      .getRawMany();
    console.log('acceptedRows', acceptedRows);
    const acceptedCount = acceptedRows.length + 1;

    if (String(exp.txnType) === 'expense' && acceptedCount > 1) {
      const share = Number((Number(exp.amount) / (acceptedCount + 1)).toFixed(2));

      await this.groupMembersBalanceService.expenseBalance(
        exp.id,
        share,
        exp.paidById,
        exp.groupId,
        acceptedRows,
      );
    }

    const now = new Date();
    await expenseRepo.update({ id: exp.id }, { finalizedAt: now });

    this.finalizer?.cancel(exp.id);

    //Notify payer about finalization
    await this.notifyPayer(exp.id, 'finalization', acceptedCount);

    return {
      finalized: true,
      expenseId: exp.id,
      groupId: exp.groupId,
      acceptedCount,
    };
  }

  async respond(
    expenseId: number,
    member: GroupMember,
    status: ParticipantStatus,
  ) {
    return this.repo.manager.transaction(async (manager) => {
      const expenseRepo = manager.getRepository(Expense);
      const participantRepo = manager.getRepository(ExpenseParticipant);

      const exp = await expenseRepo
        .createQueryBuilder('e')
        .setLock('pessimistic_write')
        .where('e.id = :expenseId', { expenseId })
        .getOne();

      if (!exp) {
        throw new BadRequestException('Expense not found');
      }

      if (exp.finalizedAt) {
        return { finalized: true, expenseId };
      }
      
      await participantRepo
        .createQueryBuilder()
        .update(ExpenseParticipant)
        .set({ status, respondedAt: () => 'now()', hasMissed: false })
        .where('expense_id = :expenseId', { expenseId })
        .andWhere('member_id = :memberId', { memberId: member.id })
        .execute();

      await this.notifyPayer(expenseId, 'response', 0, member.user.name, status);

      const pending = await participantRepo
        .createQueryBuilder('p')
        .where('p.expense_id = :expenseId', { expenseId })
        .andWhere('p.status = :status', { status: ParticipantStatus.Pending })
        .getCount();

      if (pending > 0) {
        return { finalized: false, expenseId };
      }

      const result = await this.finalizeCore(manager, exp, {
        declinePendingBeforeFinalize: false,
      });

      return { finalized: true, expenseId: result.expenseId, groupId: result.groupId };
    });
  }

  async finalizeIfExpired(expenseId: number, opts?: { force?: boolean }) {
    const { force = false } = opts ?? {};

    return this.repo.manager.transaction(async (manager) => {
      const expenseRepo = manager.getRepository(Expense);

      const exp = await expenseRepo
        .createQueryBuilder('e')
        .setLock('pessimistic_write')
        .where('e.id = :expenseId', { expenseId })
        .getOne();

      if (!exp) throw new BadRequestException('Expense not found');

      if (exp.finalizedAt) {
        return {
          finalized: true,
          expenseId: exp.id,
          groupId: exp.groupId,
          alreadyFinalized: true,
        };
      }

      const now = new Date();
      const deadline = new Date(exp.acceptanceDeadline);

      if (!force && now < deadline) {
        return {
          finalized: false,
          reason: 'not_expired_yet',
          expenseId: exp.id,
        };
      }

      //Expired or forced -> decline remaining pendings, then finalize
      const result = await this.finalizeCore(manager, exp, {
        declinePendingBeforeFinalize: true,
      });

      return {
        finalized: true,
        expenseId: result.expenseId,
        groupId: result.groupId,
        acceptedCount: result.acceptedCount,
      };
    });
  }

  findPendingEventsForUser(userId: number) {
    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.expense', 'expense')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('paidBy.user', 'paidByUser')
      .innerJoin('p.member', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('p.status = :status', { status: ParticipantStatus.Pending })
      .getMany();
  }

  async findMissedExpensesForUser(userId: number) {
    const expenses = await this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.expense', 'expense')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('paidBy.user', 'paidByUser')
      .leftJoinAndSelect('p.member', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('expense.finalized_at IS NOT NULL')
      .andWhere('p.has_missed = :hasMissed', { hasMissed: true })
      .getMany();

    return expenses.map((p) => new BaseExpenseDto(p.expense));
  }

  async participateInExpense(
    expenseId: number,
    memberId: number,
    status: ParticipantStatus,
  ) {
    return this.repo.manager.transaction(async (manager) => {
      const expenseRepo = manager.getRepository(Expense);
      const participantRepo = manager.getRepository(ExpenseParticipant);

      const exp = await expenseRepo
        .createQueryBuilder('e')
        .setLock('pessimistic_write')
        .where('e.id = :expenseId', { expenseId })
        .getOne();

      if (!exp) {
        throw new BadRequestException('Expense not found');
      }

      if (!exp.finalizedAt) {
        throw new BadRequestException('Expense is not finalized yet');
      }

      if (exp.txnType === TxnType.TRANSFER) {
        throw new BadRequestException(
          'Cannot participate in transfer expenses',
        );
      }

      await participantRepo
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.expense_id = :expenseId', { expenseId })
        .getMany();

      const existingParticipant = await participantRepo.findOne({
        where: { expenseId, memberId },
      });

      if (!existingParticipant) {
        throw new BadRequestException('Participant not found for this expense');
      }

      if (existingParticipant.status === ParticipantStatus.Accepted) {
        throw new BadRequestException('Participant already added to expense');
      }

      if (status === ParticipantStatus.Declined) {
        await participantRepo.update(
          { expenseId, memberId },
          {
            status: ParticipantStatus.Declined,
            hasMissed: false,
            respondedAt: () => 'CURRENT_TIMESTAMP',
          },
        );
        return existingParticipant;
      }

      const oldParticipants = await participantRepo
        .createQueryBuilder('p')
        .select('p.member_id', 'member_id')
        .where('p.expense_id = :expenseId', { expenseId })
        .andWhere('p.status = :status', { status: ParticipantStatus.Accepted })
        .getRawMany<{ member_id: string }>()
        .then((rows) => rows.map((r) => ({ memberId: Number(r.member_id) })));

      await this.groupMembersBalanceService.expenseBalanceForNewParticipant(
        expenseId,
        exp.amount,
        exp.paidById,
        exp.groupId,
        memberId,
        oldParticipants,
      );

      await participantRepo.update(
        { expenseId, memberId },
        { status, hasMissed: false, respondedAt: () => 'CURRENT_TIMESTAMP' },
      );
    });
  }

  async notifyPayer(
    expenseId: number,
    type: 'response' | 'finalization',
    acceptedCount?: number,
    respondFrom?: string,
    status?: ParticipantStatus,
  ) {
    const exp = await this.expenseService.findOne(expenseId);
    if (!exp) {
      return;
    }
    const evType =
      type === 'response' ? 'expense.responded' : 'expense.finalized';
    let data: ResponseExpenseEvent | FinalizedExpenseEvent;
    let ev: UserEvent;

    if (evType === 'expense.responded' && respondFrom && status) {
      data = {
        expense: exp,
        respondFrom,
        groupName: exp?.group?.name || 'Loading...',
        groupCurrencyCode: exp?.group?.baseCurrencyCode || 'USD',
        status,
      };
      ev = { type: evType, data };
    } else {
      data = {
        expense: exp,
        expensePartcipantsCount: acceptedCount || 0,
        groupName: exp?.group?.name || 'Loading...',
        groupCurrencyCode: exp?.group?.baseCurrencyCode || 'USD',
      };
      ev = { type: 'expense.finalized', data };
    }

    this.bus.emitToUser(exp.paidBy.user.id, ev);
  }

  async notifyReciever(expenseId: number) {
    const expense = await this.expenseService.findOne(expenseId);
    if (!expense) throw new BadRequestException('Expense not found');
    if(expense.txnType !== TxnType.TRANSFER) return;

    const ev: UserEvent = {
      type: 'expense.transferred',
      data: {
        expense,
        transferFrom: expense.paidBy?.user.name || 'Loading...',
        groupName: expense?.group?.name || 'Loading...',
        groupCurrencyCode: expense?.group?.baseCurrencyCode || 'USD',
        amount: expense.amount,
      },
    };
    console.log('Notifying user id:', expense.paidTo?.user.id, 'with event:', ev);
    this.bus.emitToUser(expense.paidTo?.user.id || 0, ev);
  }
}
