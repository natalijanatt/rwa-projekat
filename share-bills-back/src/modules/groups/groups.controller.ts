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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { BaseGroupDto } from './dto/base-group.dto';
import { FullGroupDto } from './dto/full-group.dto';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupMember } from '../group-members/group-members.entity';
import { BaseGroupMemberDto } from '../group-members/dto/BaseGroupMember.dto';
import { GroupMembersService } from '../group-members/group-members.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PAGINATION } from '../../common/constants/pagination.constants';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupMembersService: GroupMembersService,
    private readonly storage: StorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@CurrentUser() userId: number): Promise<BaseGroupDto[]> {
    const groups = await this.groupsService.findAll(userId);

    return groups.map((group) => ({
      ...group,
      imagePath: group.imagePath
        ? this.storage.getPublicUrl(group.imagePath)
        : undefined,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @CurrentUser() userId: number,
    @Param('id') id: string,
  ): Promise<FullGroupDto> {
    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    
    const group = await this.groupsService.findOne(+id, userId);

    // Process group image
    if (group.imagePath) {
      group.imagePath = this.storage.getPublicUrl(group.imagePath);
    }

    // Process member images
    if (group.members) {
      group.members = group.members.map(member => ({
        ...member,
        user: {
          ...member.user,
          imagePath: member.user.imagePath 
            ? this.storage.getPublicUrl(member.user.imagePath)
            : undefined
        }
      }));
    }

    return group;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: PAGINATION.MAX_LIMIT * 1024 * 1024 },
    }),
  )
  @Post()
  async create(
    @CurrentUser() userId: number,
    @Body(ValidationPipe) group: CreateGroupDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: PAGINATION.MAX_LIMIT * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    image?: Express.Multer.File,
  ): Promise<Group> {
    const created = await this.groupsService.create(group, userId);

    if (image) {
      const { path } = await this.storage.uploadGroupCover(created.id, image);
      await this.groupsService.updateCover(created.id, path);
    }
    return created;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/members')
  async getMembers(
    @CurrentUser() userId: number,
    @Param('id') id: string,
  ): Promise<BaseGroupMemberDto[]> {
    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated) {
      throw new ForbiddenException(
        'You have to be a member of the group to see its members',
      );
    }
    return this.groupMembersService.getMembers(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':group_id/new-member/:member_id')
  async addMember(
    @CurrentUser() userId: number,
    @Param('group_id') groupId: string,
    @Param('member_id') memberId: string,
  ): Promise<GroupMember> {
    if (isNaN(+groupId) || isNaN(+memberId)) {
      throw new BadRequestException('Invalid group or member ID');
    }

    const validated = await this.groupsService.checkMembership(userId, +groupId);
    if (!validated) {
      throw new ForbiddenException(
        'You do not have permission to add members to this group',
      );
    }

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

  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  async getGroupMembers(
    @CurrentUser() userId: number,
    @Param('id') id: string,
  ): Promise<BaseGroupMemberDto[]> {
    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    return this.groupMembersService.getMembers(+id);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: PAGINATION.MAX_LIMIT * 1024 * 1024 },
    }),
  )
  @Patch(':id')
  async update(
    @CurrentUser() userId: number,
    @Param('id') id: string,
    @Body(ValidationPipe) group: UpdateGroupDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: PAGINATION.MAX_LIMIT * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    image?: Express.Multer.File,
  ): Promise<BaseGroupDto> {
    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated) {
      throw new ForbiddenException(
        'You do not have permission to update this group',
      );
    }

    const updated = await this.groupsService.update(+id, group);

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
