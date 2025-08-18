import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMember } from './group-members.entity';
import { Repository } from 'typeorm';
import { BaseGroupMemberDto } from './dto/BaseGroupMember.dto';
import { PendingExpenseBus } from 'src/realtime/pending-expense.bus';
import { PendingExpenseEvent } from '../expenses/dto/pending-expense-event';
import { Expense } from '../expenses/expense.entity';
import { ParticipantStatus } from '../expense-participants/expense-participants.entity';

@Injectable()
export class GroupMembersService {
    constructor(
        @InjectRepository(GroupMember)
        private readonly repo: Repository<GroupMember>,
        private readonly bus: PendingExpenseBus
    ) {}

    async findAll(): Promise<GroupMember[]> {
        return this.repo.find();
    }

    async findOne(id: number): Promise<GroupMember | null> {
        return this.repo.findOneBy({ id });
    }

    async addMemberToGroup(groupId: number, userId: number): Promise<GroupMember> {
        const newMember = this.repo.create({ groupId, userId });
        return this.repo.save(newMember);
    }

    async getMembers(groupId: number): Promise<BaseGroupMemberDto[]> {
        const groupMembers = await this.repo.createQueryBuilder('group_member')
            .leftJoinAndSelect('group_member.user', 'user')
            .where('group_member.groupId = :groupId', { groupId })
            .getMany();
        return groupMembers.map(member => new BaseGroupMemberDto(member));
    }

    async getMemberByUserId(groupId: number, userId: number): Promise<GroupMember | null> {
        return this.repo.findOne({
            where: { groupId, userId },
        });
    }
    
    async delete(id: number): Promise<void> {
        await this.repo.delete(id);
    }

    async emitToGroup(groupId: number, expense: Expense) {

        const members = await this.getMembers(groupId);
        members.forEach(member => {
            const ev: PendingExpenseEvent = {
                type: 'pending-expense',
                expense,
                me: { status: ParticipantStatus.Pending, memberId: member.userId },
            };
            this.bus.emitToUser(member.userId, ev);
            console.log('[BUS] emit to', member.userId, ev.expense.id);

        });
    }
}
