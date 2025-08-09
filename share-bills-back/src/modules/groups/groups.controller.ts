import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { BaseGroupDto } from './dto/base-group.dto';
import { AuthGuard } from '@nestjs/passport';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupMember } from '../group-members/group-members.entity';
import { BaseGroupMemberDto } from '../group-members/dto/BaseGroupMember.dto';
import { GroupMembersService } from '../group-members/group-members.service';

@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService, private readonly groupMembersService: GroupMembersService) {}

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll(
        @Req() req: Request & { user: { userId: number } }
    ): Promise<BaseGroupDto[]> {
        const userId = req.user?.userId;
            if (!userId || isNaN(Number(userId))) {
              throw new BadRequestException('You have to be logged in to access this resource');
            }
        return this.groupsService.findAll(userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findOne(
        @Req() req: Request & { user: { userId: number } },
        @Param('id') id: string): Promise<Group | null> {
        const userId = req.user?.userId;
        if (!userId || isNaN(Number(userId))) {
            throw new BadRequestException('You have to be logged in to access this resource');
        }
        const validated = await this.groupsService.checkMembership(userId, +id);
        if (!validated) throw new ForbiddenException('You do not have access to this resource');
        return this.groupsService.findOne(+id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Req() req: Request & { user: { userId: number } },
        @Body(ValidationPipe) group: CreateGroupDto): Promise<Group> {
        const userId = req.user?.userId;
        if (!userId || isNaN(Number(userId))) {
            throw new BadRequestException('You have to be logged in to create a group');
        }
        return this.groupsService.create(group, userId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/members')
    async getMembers(
        @Req() req: Request & { user: { userId: number } },
        @Param('id') id: string
    ): Promise<BaseGroupMemberDto[]> {
        const userId = req.user?.userId;
        if (!userId || isNaN(Number(userId))) {
            throw new BadRequestException('You have to be logged in to access this resource');
        }
        const validated = await this.groupsService.checkMembership(userId, +id);
        if (!validated) throw new ForbiddenException('You have to be a member of the group to see its members');
        const members = await this.groupMembersService.getMembers(+id);
        return members;
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':group_id/new-member/:member_id')
    async addMember(
        @Req() req: Request & { user: { userId: number } },
        @Param('group_id') groupId: string, @Param('member_id') memberId: string): Promise<GroupMember> {

        if (isNaN(+groupId) || isNaN(+memberId) || !req.user.userId) {
            throw new BadRequestException('Invalid group or member ID');
        }

        const validated = await this.groupsService.checkOwnership(req.user.userId, +groupId);
        if (!validated) throw new ForbiddenException('You do not have permission to add members to this group');

        return this.groupsService.addMemberToGroup(+groupId, +memberId);
    }

    // @Patch(':id')
    // update(@Param('id') id: string, @Body(ValidationPipe) group: UpdateGroupDto): Promise<Group | null> {
    //     return this.groupsService.update(+id, group);
    // }

    // @Delete(':id')
    // delete(@Param('id') id: string): Promise<void> {
    //     return this.groupsService.delete(+id);
    // }
}
