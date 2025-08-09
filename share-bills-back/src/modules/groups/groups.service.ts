import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { Repository } from 'typeorm';
import { BaseGroupDto } from './dto/base-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupMembersService } from '../group-members/group-members.service';

@Injectable()
export class GroupsService {
    constructor(
        @InjectRepository(Group)
        private readonly repo: Repository<Group>,
        private readonly groupMembersService: GroupMembersService
    ) {}

    async findAll(memberId: number): Promise<BaseGroupDto[]> {
        const groups = await this.repo.createQueryBuilder('group')
            .innerJoinAndSelect('group.members', 'members')
            .where('members.user_id = :memberId', { memberId })
            .getMany();
        return groups.map(group => new BaseGroupDto(group));
    }

    async findOne(groupId: number): Promise<Group | null> {
        return this.repo.findOneBy({ id: groupId });
    }

    async checkMembership(userId: number, groupId: number): Promise<boolean> {
        const group = await this.repo.createQueryBuilder('group')
            .innerJoinAndSelect('group.members', 'members')
            .where('group.id = :groupId', { groupId })
            .andWhere('members.user_id = :userId', { userId })
            .getOne();

        return !!group;
    }

    async create(data: CreateGroupDto, userId: number): Promise<Group> {
        const newGroup = this.repo.create(data);
        newGroup.ownerId = userId;
        await this.repo.save(newGroup);
        await this.groupMembersService.addMemberToGroup(newGroup.id, userId);
        return newGroup;
    }

    // async update(id: number, data: UpdateGroupDto): Promise<Group | null> {
    //     const group = await this.findOne(id);
    //     if (!group) return null;
    //     this.repo.merge(group, data);
    //     return this.repo.save(group);
    // }

    // async delete(id: number): Promise<void> {
    //     await this.repo.delete(id);
    // }
}
