import { BadRequestException, Injectable } from '@nestjs/common';
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

@Injectable()
export class ExpenseParticipantsService {
  constructor(
    @InjectRepository(ExpenseParticipant)
    private readonly repo: Repository<ExpenseParticipant>,
    private readonly expenseService: ExpensesService,
    private readonly groupMembersBalanceService: GroupMembersBalanceService,
    private readonly finalizer: ExpenseFinalizerService,
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

        // acceptanceDeadline can be Date or string; both work with new Date(...)
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

  async respond(
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

      if (exp.finalizedAt) {
        return { finalized: true, expenseId };
      }

      await participantRepo
        .createQueryBuilder()
        .update(ExpenseParticipant)
        .set({ status, respondedAt: () => 'now()', hasMissed: false })
        .where('expense_id = :expenseId', { expenseId })
        .andWhere('member_id = :memberId', { memberId })
        .execute();

      const pending = await participantRepo
        .createQueryBuilder('p')
        .where('p.expense_id = :expenseId', { expenseId })
        .andWhere('p.status = :status', { status: 'pending' })
        .getCount();

      if (pending > 0) {
        return { finalized: false, expenseId };
      }

      if (String(exp.txnType) === 'expense') {
        const acceptedRows: { memberId: number }[] = await participantRepo
          .createQueryBuilder('p')
          .select('p.member_id', 'memberId')
          .where('p.expense_id = :expenseId', { expenseId })
          .andWhere('p.status = :status', { status: 'accepted' })
          .andWhere('p.member_id <> :payerId', { payerId: exp.paidById })
          .getRawMany();

        const accepted = acceptedRows.length;

        if (accepted === 0) {
          throw new BadRequestException(
            'No participants (excluding payer) accepted the expense',
          );
        }

        const share = Number((Number(exp.amount) / (accepted + 1)).toFixed(2));

        await this.groupMembersBalanceService.expenseBalance(
          expenseId,
          share,
          exp.paidById,
          exp.groupId,
          acceptedRows,
        );
      }

      await expenseRepo.update({ id: expenseId }, { finalizedAt: new Date() });
      return { finalized: true, expenseId, groupId: exp.groupId };
    });
  }

  async finalizeIfExpired(expenseId: number, opts?: { force?: boolean }) {
    const { force = false } = opts ?? {};

    return this.repo.manager.transaction(async (manager) => {
      const expenseRepo = manager.getRepository(Expense);
      const participantRepo = manager.getRepository(ExpenseParticipant);

      const exp = await expenseRepo
        .createQueryBuilder('e')
        .setLock('pessimistic_write')
        .where('e.id = :expenseId', { expenseId })
        .getOne();

      if (!exp) throw new BadRequestException('Expense not found');

      if (exp.finalizedAt)
        return {
          finalized: true,
          expenseId: exp.id,
          groupId: exp.groupId,
          alreadyFinalized: true,
        };

      const now = new Date();
      const deadline = new Date(exp.acceptanceDeadline);

      // If not forced and not yet past deadline, bail
      if (!force && now < deadline) {
        return {
          finalized: false,
          reason: 'not_expired_yet',
          expenseId: exp.id,
        };
      }

      await participantRepo
        .createQueryBuilder()
        .update(ExpenseParticipant)
        .set({ status: ParticipantStatus.Declined })
        .where('expense_id = :expenseId', { expenseId: exp.id })
        .andWhere('status = :pending', { pending: ParticipantStatus.Pending })
        .execute();

      const acceptedRows: { memberId: number }[] = await participantRepo
        .createQueryBuilder('p')
        .select('p.member_id', 'memberId')
        .where('p.expense_id = :expenseId', { expenseId: exp.id })
        .andWhere('p.status = :status', { status: ParticipantStatus.Accepted })
        .andWhere('p.member_id <> :payerId', { payerId: exp.paidById })
        .getRawMany();

      const acceptedIds = acceptedRows.map((r) => r.memberId);
      const acceptedCount = acceptedIds.length;

      if (String(exp.txnType) === 'expense' && acceptedCount > 0) {
        const share = Number(
          (Number(exp.amount) / (acceptedCount + 1)).toFixed(2),
        );

        await this.groupMembersBalanceService.expenseBalance(
          exp.id,
          share,
          exp.paidById,
          exp.groupId,
          acceptedRows,
        );
      }

      await expenseRepo.update({ id: exp.id }, { finalizedAt: now });
      this.finalizer?.cancel(expenseId);
      return {
        finalized: true,
        expenseId: exp.id,
        groupId: exp.groupId,
        acceptedCount,
      };
    });
  }

  findPendingEventsForUser(userId: number) {
    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.expense', 'expense')
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
      .leftJoinAndSelect('paidBy.user', 'paidByUser') // <-- missing join
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
}
