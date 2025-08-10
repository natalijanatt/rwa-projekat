import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseParticipant } from './expense-participants.entity';

import { from, interval, switchMap, timer } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { ExpensesService } from '../expenses/expenses.service';
import { Expense } from '../expenses/expense.entity';
import { DataSource } from 'typeorm';
import e from 'express';

@Injectable()
export class ExpenseParticipantsService {
  constructor(
    @InjectRepository(ExpenseParticipant)
    private readonly repo: Repository<ExpenseParticipant>,
    private readonly expenseService: ExpensesService,
    private readonly ds: DataSource,
  ) {}

  countdown(expenseId: number) {
  return timer(0, 1000).pipe(
    switchMap(() => from(this.expenseService.findOne(expenseId))),
    map((expense: Expense | null) => {
      if (!expense) return { data: { msLeft: 0, finalized: true } };

      // acceptanceDeadline can be Date or string; both work with new Date(...)
      const deadlineMs = new Date(expense.acceptanceDeadline).getTime();
      const msLeft = Math.max(0, deadlineMs - Date.now());

      const finalized =
        Boolean(expense.finalizedAt) || msLeft <= 0;

      return { data: { msLeft, finalized } } as {
        data: { msLeft: number; finalized: boolean };
      };
    }),
    takeWhile(evt => !evt.data.finalized, true),
  );
}


  async respond(
    expenseId: number,
    memberId: number,
    status: 'accepted' | 'declined',
  ) {
    return this.ds.transaction(
      'READ COMMITTED',
      async (transactionalEntityManager) => {
        const expArr: Expense[] = await transactionalEntityManager.query(
          `SELECT id, group_id, txn_type, amount, paid_by_id, acceptance_deadline, finalized_at
           FROM expenses
          WHERE id = $1
          FOR UPDATE`,
          [expenseId],
        );
        const exp = expArr[0];
        if (!exp) throw new BadRequestException('Expense not found');
        if (exp.finalizedAt) return { finalized: true, expenseId };

        //Update the participant's status if it is still pending
        await transactionalEntityManager.query(
          `UPDATE expense_participants
            SET status = $1, responded_at = now()
          WHERE expense_id = $2 AND member_id = $3 AND status = 'pending'`,
          [status, expenseId, memberId],
        );

        const result: { pending: number }[] =
          await transactionalEntityManager.query(
            `SELECT COUNT(*)::int AS pending
         FROM expense_participants
         WHERE expense_id = $1 AND status = 'pending'`,
            [expenseId],
          );
        const pending = result[0]?.pending ?? 0;

        if (pending > 0) {
          return { finalized: false, expenseId };
        }

        if (exp.txnType.toString() === 'expense') {
          const n: { pending: number }[] =
            await transactionalEntityManager.query(
              `SELECT COUNT(*)::int AS n
             FROM expense_participants
            WHERE expense_id = $1 AND status = 'accepted'`,
              [expenseId],
            );
          const accepted = n[0]?.pending ?? 0;
          if (accepted === 0) {
            throw new BadRequestException(
              'No participants accepted the expense',
            );
          }
          if (accepted > 1) {
            const splitAmount = exp.amount / accepted;
            //delete later
            console.log('Finishing expense', splitAmount, accepted);
          }
          //! finish the expense
        } else if (exp.txnType.toString() === 'transfer') {
          await transactionalEntityManager.query(
            `UPDATE group_member_balances b
              SET balance = b.balance - $1
            WHERE b.group_id = $2
              AND b.from_member_id = (SELECT paid_to   FROM expenses WHERE id = $3)
              AND b.to_member_id   = (SELECT paid_by_id FROM expenses WHERE id = $3)`,
            [exp.amount, exp.groupId, expenseId],
          );
        }
        await transactionalEntityManager.query(`UPDATE expenses SET finalized_at = now() WHERE id = $1`, [expenseId]);

        //! this.gateway.notifyFinalized(exp.group_id, expenseId);

        return { finalized: true, expenseId, groupId: exp.groupId };
      },
    );
  }
}
