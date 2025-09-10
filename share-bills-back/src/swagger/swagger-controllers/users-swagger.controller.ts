import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiParam
} from '@nestjs/swagger';
import { UsersService } from '../../modules/users/users.service';
import { UpdateUserDto } from '../../modules/users/dto/update-user.dto';
import { FullUserDto } from '../../modules/users/dto/full-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseUserSwaggerDto } from '../swagger-dto/base-user-swagger.dto';
import { FilterUserDto } from '../../modules/users/dto/filter-user.dto';
import { ExpensesService } from '../../modules/expenses/expenses.service';
import { StorageService } from '../../modules/storage/storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersSwaggerController {
  constructor(
    private readonly usersService: UsersService,
    private readonly expensesService: ExpensesService,
    private storage: StorageService,
  ) {}

  @ApiOperation({ 
    summary: 'Pretraži korisnike',
    description: 'Vraća listu korisnika na osnovu pretrage po imenu ili email-u'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista pronađenih korisnika',
    type: [BaseUserSwaggerDto]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiQuery({ 
    name: 'query', 
    required: false, 
    description: 'Tekst za pretragu korisnika',
    example: 'marko'
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @CurrentUser() userId: number,
    @Query('query') query: string,
  ): Promise<BaseUserSwaggerDto[]> {
    const filter: FilterUserDto = { query };
    
    const users = await this.usersService.findAll(filter);
    return users.map(user => ({
      ...user,
      imagePath: user.imagePath ? this.storage.getPublicUrl(user.imagePath) : undefined,
    }));
  }

  @ApiOperation({ 
    summary: 'Dobij profil korisnika',
    description: 'Vraća detaljne informacije o trenutno ulogovanom korisniku'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detaljne informacije o korisniku',
    type: FullUserDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getOne(@CurrentUser() userId: number): Promise<FullUserDto> {
    const user = await this.usersService.findOne(userId);
    const expensesCount = await this.expensesService.getExpenseCountForUser(userId);
    
    return {
      ...user,
      imagePath: user.imagePath ? this.storage.getPublicUrl(user.imagePath) : undefined,
      expensesCount,
    } as FullUserDto;
  }

  @ApiOperation({ 
    summary: 'Ažuriraj profil korisnika',
    description: 'Ažurira informacije o korisniku i opciono sliku profila'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Korisnik je uspešno ažuriran' 
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
    description: 'Podaci za ažuriranje korisnika',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Ime korisnika',
          example: 'Marko Petrović'
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Email adresa',
          example: 'marko.petrovic@example.com'
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Slika profila (jpg, jpeg, png, webp)'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Patch()
  async update(
    @CurrentUser() userId: number,
    @Body(ValidationPipe) user: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      })
    ) file?: Express.Multer.File
  ) {
    if (file) {
      const { path } = await this.storage.uploadUserAvatar(userId, file);
      await this.usersService.updateAvatar(userId, path);
    }

    return this.usersService.update(userId, user);
  }

  @ApiOperation({ 
    summary: 'Postavi sliku profila',
    description: 'Upload-uje novu sliku profila za korisnika'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Slika profila je uspešno postavljena',
    schema: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: 'Putanja do slike',
          example: 'avatars/user123.jpg'
        },
        image_url: {
          type: 'string',
          description: 'URL slike',
          example: 'https://example.com/avatars/user123.jpg'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Nije priložena slika' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neautorizovan pristup' 
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Slika profila',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Slika profila (jpg, jpeg, png, webp)'
        }
      },
      required: ['file']
    }
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('avatar')
  async getUserAvatar(
    @CurrentUser() userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    const { path, url } = await this.storage.uploadUserAvatar(userId, file);
    await this.usersService.updateAvatar(userId, path);
    
    return { image_path: path, image_url: url };
  }
}

