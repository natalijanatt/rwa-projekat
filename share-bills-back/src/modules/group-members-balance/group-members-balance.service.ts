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
    acceptedRows: { memberId: number }[],
  ) {
    const memberIds = acceptedRows.map((row) => row.memberId);

    // 1) others -> payer += share
    const res1 = await this.repo
      .createQueryBuilder()
      .update()
      .set({ balance: () => `balance + :share` })
      .where('group_id = :groupId', { groupId })
      .andWhere('to_member_id = :paidById', { paidById })
      .andWhere('from_member_id IN (:...memberIds)', { memberIds })
      .setParameters({ share })
      .execute();

    // 2) payer -> others -= share
    const res2 = await this.repo
      .createQueryBuilder()
      .update()
      .set({ balance: () => `balance - :share` })
      .where('group_id = :groupId', { groupId })
      .andWhere('from_member_id = :paidById', { paidById })
      .andWhere('to_member_id IN (:...memberIds)', { memberIds })
      .setParameters({ share })
      .execute();

    return { affected1: res1.affected ?? 0, affected2: res2.affected ?? 0 };
  }

  async transferBalance(
    expenseId: number,
    share: number,
    paidById: number,
    paidToId: number,
    groupId: number,
  ) {
    // 1) payer -> receiver -= share
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ balance: () => `balance - :share` })
      .where('from_member_id = :paidById', { paidById })
      .andWhere('to_member_id = :paidToId', { paidToId })
      .andWhere('group_id = :groupId', { groupId })
      .setParameters({ share, expenseId, paidById, paidToId, groupId })
      .execute();

    // 2) receiver -> payer += share
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ balance: () => `balance + :share` })
      .where('from_member_id = :paidToId', { paidToId })
      .andWhere('to_member_id = :paidById', { paidById })
      .andWhere('group_id = :groupId', { expenseId })
      .setParameters({ share, expenseId, paidById, paidToId, groupId })
      .execute();
  }

  async expenseBalanceForNewParticipant(
    expenseId: number,
    amount: number,
    payerId: number,
    groupId: number,
    newMemberId: number,
    acceptedRows: { memberId: number }[],
  ) {
    
    const numberOfParticipants = acceptedRows.length;

    if (numberOfParticipants === 0) {
      throw new Error('No participants to balance with');
    }
    
    const oldBalance = -1 * amount /numberOfParticipants;
    const newBalance = amount/(numberOfParticipants+ 1);

    // 1) remove old balances
    await this.expenseBalance(
      expenseId,
      oldBalance,
      payerId,
      groupId,
      acceptedRows
    );

    // 2) add new balances
    acceptedRows.push({ memberId: newMemberId });
    await this.expenseBalance(
      expenseId,
      newBalance,
      payerId,
      groupId,
      acceptedRows
    );
  }

}
