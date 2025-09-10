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
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FullUserDto } from './dto/full-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseUserDto } from './dto/base-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { ExpensesService } from '../expenses/expenses.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly expensesService: ExpensesService,
    private storage: StorageService,
  ) {}


  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @CurrentUser() userId: number,
    @Query('query') query: string,
  ): Promise<BaseUserDto[]> {
    const filter: FilterUserDto = { query };
    
    const users = await this.usersService.findAll(filter);
    return users.map(user => ({
      ...user,
      imagePath: user.imagePath ? this.storage.getPublicUrl(user.imagePath) : undefined,
    }));
  }

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
