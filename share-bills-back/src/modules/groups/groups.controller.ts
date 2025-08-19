import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  ForbiddenException,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { BaseGroupDto } from './dto/base-group.dto';
import { AuthGuard } from '@nestjs/passport';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupMember } from '../group-members/group-members.entity';
import { BaseGroupMemberDto } from '../group-members/dto/BaseGroupMember.dto';
import { GroupMembersService } from '../group-members/group-members.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupMembersService: GroupMembersService,
    private readonly storage: StorageService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Req() req: Request & { user: { userId: number } },
  ): Promise<BaseGroupDto[]> {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'You have to be logged in to access this resource',
      );
    }
    const groups = await this.groupsService.findAll(userId);

    groups.map((group) => {
      group.imagePath = group.imagePath
        ? this.storage.getPublicUrl(group.imagePath)
        : undefined;
    });

    return groups;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(
    @Req() req: Request & { user: { userId: number } },
    @Param('id') id: string,
  ): Promise<BaseGroupDto | null> {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'You have to be logged in to access this resource',
      );
    }
    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated)
      throw new ForbiddenException('You do not have access to this resource');
    const group = await this.groupsService.findOne(+id);

    return group
      ? {
          ...group,
          imagePath: group.imagePath
            ? this.storage.getPublicUrl(group.imagePath)
            : undefined,
        }
      : null;
  }

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Post()
  async create(
    @Req() req: Request & { user: { userId: number } },
    @Body(ValidationPipe) group: CreateGroupDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    image?: Express.Multer.File,
  ): Promise<Group> {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'You have to be logged in to create a group',
      );
    }
    const created = await this.groupsService.create(group, userId);

    if (image) {
      const { path } = await this.storage.uploadGroupCover(created.id, image);
      await this.groupsService.updateCover(created.id, path);
    }
    return created;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/members')
  async getMembers(
    @Req() req: Request & { user: { userId: number } },
    @Param('id') id: string,
  ): Promise<BaseGroupMemberDto[]> {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'You have to be logged in to access this resource',
      );
    }
    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated)
      throw new ForbiddenException(
        'You have to be a member of the group to see its members',
      );
    const members = await this.groupMembersService.getMembers(+id);
    return members;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':group_id/new-member/:member_id')
  async addMember(
    @Req() req: Request & { user: { userId: number } },
    @Param('group_id') groupId: string,
    @Param('member_id') memberId: string,
  ): Promise<GroupMember> {
    if (isNaN(+groupId) || isNaN(+memberId) || !req.user.userId) {
      throw new BadRequestException('Invalid group or member ID');
    }

    const validated = await this.groupsService.checkMembership(
      req.user.userId,
      +groupId,
    );
    if (!validated)
      throw new ForbiddenException(
        'You do not have permission to add members to this group',
      );

    const memberExists = await this.groupsService.checkMembership(
      +memberId,
      +groupId,
    );

    if (memberExists) {
      throw new BadRequestException(
        'User is already a member of this group',
      );
    }

    return this.groupsService.addMemberToGroup(+groupId, +memberId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/members')
  async getGroupMembers(
    @Req() req: Request & { user: { userId: number } },
    @Param('id') id: string,
  ): Promise<BaseGroupMemberDto[]> {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'You have to be logged in to access this resource',
      );
    }
    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated)
      throw new ForbiddenException('You do not have access to this resource');
    return this.groupMembersService.getMembers(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body(ValidationPipe) group: UpdateGroupDto): Promise<Group | null> {
  //     return this.groupsService.update(+id, group);
  // }

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Patch(':id')
  async update(
    @Req() req: Request & { user: { userId: number } },
    @Param('id') id: string,
    @Body(ValidationPipe) group: UpdateGroupDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    image?: Express.Multer.File,
  ): Promise<BaseGroupDto | null> {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'You have to be logged in to create a group',
      );
    }

    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated)
      throw new ForbiddenException(
        'You do not have permission to update this group',
      );

    const updated = await this.groupsService.update(+id, group);

    if (!updated) {
      throw new BadRequestException(
        'Group not found or you do not have permission to update it',
      );
    }
    if (image) {
      const { path } = await this.storage.uploadGroupCover(updated.id, image);
      await this.groupsService.updateCover(updated.id, path);
    }
    return updated;
  }

  // @Delete(':id')
  // delete(@Param('id') id: string): Promise<void> {
  //     return this.groupsService.delete(+id);
  // }
}
