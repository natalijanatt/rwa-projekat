import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMember } from './group-members.entity';
import { Repository } from 'typeorm';
import { UserEventBus } from 'src/realtime/user-event.bus';
import { Expense } from '../expenses/expense.entity';
import { ParticipantStatus } from '../expense-participants/expense-participants.entity';
import { UserEvent } from 'src/realtime/user-event.types';

@Injectable()
export class GroupMembersService {
  constructor(
    @InjectRepository(GroupMember)
    private readonly repo: Repository<GroupMember>,
    private readonly bus: UserEventBus,
  ) {}

  async findAll(): Promise<GroupMember[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<GroupMember | null> {
    // return this.repo.findOneBy({ id });
    return this.repo.findOne({
      where: { id },
      relations: ['user', 'group'],
    });
  }

  async addMemberToGroup(
    groupId: number,
    userId: number,
  ): Promise<GroupMember> {
    const newMember = this.repo.create({ groupId, userId });
    return this.repo.save(newMember);
  }

  async getMembers(groupId: number): Promise<GroupMember[]> {
    const groupMembers = await this.repo
      .createQueryBuilder('group_member')
      .leftJoinAndSelect('group_member.user', 'user')
      .where('group_member.groupId = :groupId', { groupId })
      .getMany();
    return groupMembers;
  }

  async getMemberByUserId(
    groupId: number,
    userId: number,
  ): Promise<GroupMember | null> {
    return this.repo.findOne({
      where: { groupId, userId },
    });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async emitToGroup(groupId: number, expense: Expense) {
    const members = await this.getMembers(groupId);
    const paidBy = await this.findOne(expense.paidById);
    const paidByName = paidBy?.user.name || 'Loading...';
    const groupName = paidBy?.group.name || 'Loading...';
    const groupCurrencyCode = paidBy?.group.baseCurrencyCode || 'USD';
    members.forEach((member) => {
      if (member.id === expense.paidById) {
        return;
      }

      const ev: UserEvent = {
        type: 'expense.pending',
        data: {
          expense,
          groupName: groupName,
          groupCurrencyCode: groupCurrencyCode,
          paidByName: paidByName,
          me: { status: ParticipantStatus.Pending, memberId: member.id },
        },
      };
      this.bus.emitToUser(member.userId, ev);
    });
  }
}
