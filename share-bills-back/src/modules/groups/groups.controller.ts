import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { BaseGroupDto } from './dto/base-group.dto';
import { AuthGuard } from '@nestjs/passport';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) {}

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

    // @Patch(':id')
    // update(@Param('id') id: string, @Body(ValidationPipe) group: UpdateGroupDto): Promise<Group | null> {
    //     return this.groupsService.update(+id, group);
    // }

    // @Delete(':id')
    // delete(@Param('id') id: string): Promise<void> {
    //     return this.groupsService.delete(+id);
    // }
}
