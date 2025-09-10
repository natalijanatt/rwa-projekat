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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { GroupsService } from '../../modules/groups/groups.service';
import { BaseGroupDto } from '../../modules/groups/dto/base-group.dto';
import { Group } from '../../modules/groups/group.entity';
import { CreateGroupDto } from '../../modules/groups/dto/create-group.dto';
import { GroupMember } from '../../modules/group-members/group-members.entity';
import { BaseGroupMemberDto } from '../../modules/group-members/dto/BaseGroupMember.dto';
import { GroupMembersService } from '../../modules/group-members/group-members.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../../modules/storage/storage.service';
import { UpdateGroupDto } from '../../modules/groups/dto/update-group.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PAGINATION } from '../../common/constants/pagination.constants';

@ApiTags('Groups')
@Controller('groups')
export class GroupsSwaggerController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupMembersService: GroupMembersService,
    private readonly storage: StorageService,
  ) {}

  @ApiOperation({ 
    summary: 'Dobij sve grupe korisnika',
    description: 'Vraća listu svih grupa u kojima je korisnik član'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista grupa korisnika',
    type: [BaseGroupDto]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiBearerAuth('JWT-auth')
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

  @ApiOperation({ 
    summary: 'Dobij detalje grupe',
    description: 'Vraća detaljne informacije o grupi'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalji grupe',
    type: BaseGroupDto
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Nema pristupa ovoj grupi' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID grupe',
    example: 1
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @CurrentUser() userId: number,
    @Param('id') id: string,
  ): Promise<BaseGroupDto> {
    const validated = await this.groupsService.checkMembership(userId, +id);
    if (!validated) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    
    const group = await this.groupsService.findOne(+id, userId);

    return {
      ...group,
      imagePath: group.imagePath
        ? this.storage.getPublicUrl(group.imagePath)
        : undefined,
    };
  }

  @ApiOperation({ 
    summary: 'Kreiraj novu grupu',
    description: 'Kreira novu grupu sa opcionom slikom'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Grupa je uspešno kreirana',
    type: Group
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Neispravni podaci' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Podaci za kreiranje grupe',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Naziv grupe',
          example: 'Putovanje u Grčku'
        },
        description: {
          type: 'string',
          description: 'Opis grupe',
          example: 'Letnje putovanje sa prijateljima'
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Slika grupe (jpg, jpeg, png, webp)'
        }
      },
      required: ['name']
    }
  })
  @ApiBearerAuth('JWT-auth')
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

  @ApiOperation({ 
    summary: 'Dobij članove grupe',
    description: 'Vraća listu svih članova grupe'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista članova grupe',
    type: [BaseGroupMemberDto]
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Nema pristupa ovoj grupi' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID grupe',
    example: 1
  })
  @ApiBearerAuth('JWT-auth')
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

  @ApiOperation({ 
    summary: 'Dodaj člana u grupu',
    description: 'Dodaje novog člana u grupu'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Član je uspešno dodat u grupu',
    type: GroupMember
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Neispravni podaci ili korisnik već postoji u grupi' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Nema dozvolu za dodavanje članova' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiParam({ 
    name: 'group_id', 
    description: 'ID grupe',
    example: 1
  })
  @ApiParam({ 
    name: 'member_id', 
    description: 'ID korisnika koji se dodaje',
    example: 5
  })
  @ApiBearerAuth('JWT-auth')
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

  @ApiOperation({ 
    summary: 'Ažuriraj grupu',
    description: 'Ažurira informacije o grupi i opciono sliku'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Grupa je uspešno ažurirana',
    type: BaseGroupDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Neispravni podaci' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Nema dozvolu za ažuriranje grupe' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID grupe',
    example: 1
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Podaci za ažuriranje grupe',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Naziv grupe',
          example: 'Putovanje u Grčku'
        },
        description: {
          type: 'string',
          description: 'Opis grupe',
          example: 'Letnje putovanje sa prijateljima'
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Nova slika grupe (jpg, jpeg, png, webp)'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
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
}

