import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMemberBalance } from './group-members-balance.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GroupMembersBalanceService {
  constructor(
    @InjectRepository(GroupMemberBalance)
    private readonly repo: Repository<GroupMemberBalance>,
  ) {}

  async expenseBalance(
    expenseId: number,
    share: number,
    paidById: number,
    groupId: number,
  ) {
    const qb = this.repo.createQueryBuilder(); // group_member_balances repo

    const acceptedSub = qb
      .subQuery()
      .select('p.member_id')
      .from('expense_participants', 'p')
      .where('p.expense_id = :expenseId', { expenseId })
      .andWhere(`p.status = 'accepted'`)
      .andWhere('p.member_id <> :paidById', { paidById })
      .getQuery();

    // 1) others -> payer += share
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ balance: () => `balance + :share` })
      .where('group_id = :groupId', { groupId })
      .andWhere('to_member_id = :paidById', { paidById })
      .andWhere(`from_member_id IN ${acceptedSub}`)
      .setParameters({ share, expenseId, paidById })
      .execute();

    // 2) payer -> others -= share
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ balance: () => `balance - :share` })
      .where('group_id = :groupId', { groupId })
      .andWhere('from_member_id = :paidById', { paidById })
      .andWhere(`to_member_id IN ${acceptedSub}`)
      .setParameters({ share, expenseId, paidById })
      .execute();
  }
}
