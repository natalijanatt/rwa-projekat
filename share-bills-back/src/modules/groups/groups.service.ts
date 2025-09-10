import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { Repository } from 'typeorm';
import { BaseGroupDto } from './dto/base-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupMembersService } from '../group-members/group-members.service';
import { GroupMember } from '../group-members/group-members.entity';
import { UsersService } from '../users/users.service';
import { BaseUserDto } from '../users/dto/base-user.dto';
import { FullGroupDto } from './dto/full-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { BaseService } from '../../common/services/base.service';
import { GroupNotFoundException, UserNotFoundException } from '../../common/exceptions/business.exceptions';
import { COMMON_SELECT_FIELDS, getSelectFields } from '../../common/constants/pagination.constants';

@Injectable()
export class GroupsService extends BaseService<Group> {
  constructor(
    @InjectRepository(Group)
    private readonly repo: Repository<Group>,
    private readonly groupMembersService: GroupMembersService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {
    super(repo);
  }

  async findAll(memberId: number): Promise<BaseGroupDto[]> {
    const groups = await this.repo
      .createQueryBuilder('group')
      .select(getSelectFields('group', COMMON_SELECT_FIELDS.GROUP))
      .innerJoinAndSelect('group.members', 'members')
      .where('members.user_id = :memberId', { memberId })
      .getMany();
    return groups.map((group) => new BaseGroupDto(group));
  }
  async findOne(
    groupId: number,
    userId?: number,
  ): Promise<FullGroupDto> {
    let group = await this.repo
      .createQueryBuilder('group')
      .select(getSelectFields('group', COMMON_SELECT_FIELDS.GROUP))
      .addSelect(getSelectFields('memberUser', COMMON_SELECT_FIELDS.USER))
      .leftJoinAndSelect('group.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .where('group.id = :groupId', { groupId })
      .getOne();

    if (userId) {
      group = await this.repo
        .createQueryBuilder('group')
        .select(getSelectFields('group', COMMON_SELECT_FIELDS.GROUP))
        .addSelect(getSelectFields('memberUser', COMMON_SELECT_FIELDS.USER))
        .leftJoinAndSelect('group.members', 'members')
        .leftJoinAndSelect('members.user', 'memberUser')
        .leftJoinAndSelect(
          'group.balances',
          'balances',
          'balances.fromMemberId = members.id AND memberUser.id = :userId',
          { userId },
        )
        .where('group.id = :groupId', { groupId })
        .getOne();
    }

    if (!group) {
      throw new GroupNotFoundException(groupId);
    }

    const owner = await this.userService.findOne(group.ownerId);
    const secure = new FullGroupDto(group);
    secure.owner = new BaseUserDto(owner);
    return secure;
  }

  async checkMembership(userId: number, groupId: number): Promise<boolean> {
    const group = await this.repo
      .createQueryBuilder('group')
      .innerJoinAndSelect('group.members', 'members')
      .where('group.id = :groupId', { groupId })
      .andWhere('members.user_id = :userId', { userId })
      .getOne();

    return !!group;
  }

  async checkOwnership(userId: number, groupId: number): Promise<boolean> {
    const group = await this.repo.findOne({
      where: { id: groupId, ownerId: userId },
    });

    return !!group;
  }

  async create(data: CreateGroupDto, userId: number): Promise<Group> {
    const newGroup = this.repo.create(data);
    newGroup.ownerId = userId;
    await this.repo.save(newGroup);
    await this.groupMembersService.addMemberToGroup(newGroup.id, userId);
    return newGroup;
  }

  async addMemberToGroup(
    groupId: number,
    userId: number,
  ): Promise<GroupMember> {
    const group = await this.repo.findOne({
      where: { id: groupId },
      relations: ['members'],
    });
    if (!group) {
      throw new GroupNotFoundException(groupId);
    }

    const user = await this.userService.findOne(userId);
    return this.groupMembersService.addMemberToGroup(groupId, userId);
  }

  async updateCover(id: number, avatarPath: string): Promise<void> {
    const group = await this.repo.findOneBy({ id });
    if (!group) {
      throw new GroupNotFoundException(id);
    }
    await this.repo.update({ id }, { imagePath: avatarPath });
  }

  async update(id: number, data: UpdateGroupDto): Promise<BaseGroupDto> {
    const group = await this.repo.findOneBy({ id });
    if (!group) {
      throw new GroupNotFoundException(id);
    }
    
    Object.assign(group, data);
    const updatedGroup = await this.repo.save(group);
    return new BaseGroupDto(updatedGroup);
  }
}

