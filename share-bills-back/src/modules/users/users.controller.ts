import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  ValidationPipe,
  Req,
  BadRequestException,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FullUserDto } from './dto/full-user.dto';
import { StorageService } from '../storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { PendingExpenseBus } from 'src/realtime/pending-expense.bus';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private storage: StorageService,
    private readonly bus: PendingExpenseBus
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @Post('avatar')
  async getUserAvatar(
    @Req() req: Request & { user?: { userId: number } },
    @UploadedFile() file: Express.Multer.File,
  ){
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('You have to be logged in to upload an avatar');
    }
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const { path, url } = await this.storage.uploadUserAvatar(userId, file);
    await this.usersService.updateAvatar(userId, path);
    //! add a dto to return image path and url
    return {image_path: path, image_url: url};
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getOne(
    @Req() req: Request & { user?: { userId: number } },
  ): Promise<FullUserDto | null> {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('Invalid or missing user id in JWT');
    }
    const user = await this.usersService.findOne(userId);

    return user
      ? {
          ...user,
          imagePath: user.imagePath ? this.storage.getPublicUrl(user.imagePath) : undefined,
        }
      : null;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  update(
    @Req() req: Request & { user?: { userId: number } },
    @Body(ValidationPipe) user: UpdateUserDto,
  ) {
    const userId = req.user?.userId;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('Invalid or missing user id in JWT');
    }
    return this.usersService.update(userId, user);
  }

}
