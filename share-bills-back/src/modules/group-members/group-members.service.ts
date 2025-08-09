import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMember } from './group-members.entity';
import { Repository } from 'typeorm';
import { BaseGroupMemberDto } from './dto/BaseGroupMember.dto';

@Injectable()
export class GroupMembersService {
    constructor(
        @InjectRepository(GroupMember)
        private readonly repo: Repository<GroupMember>,
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

    async delete(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}
