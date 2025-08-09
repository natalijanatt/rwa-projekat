import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMember } from './group-members.entity';
import { Repository } from 'typeorm';

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

    // async update(id: number, data: UpdateGroupMemberDto): Promise<GroupMember | null> {
    //     const member = await this.findOne(id);
    //     if (!member) return null;
    //     this.repo.merge(member, data);
    //     return this.repo.save(member);
    // }

    async delete(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}
