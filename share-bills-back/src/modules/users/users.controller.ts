import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FullUserDto } from './dto/full-user.dto';
import { BaseUserDto } from './dto/base-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get()
  // getAll(@Query('role') role?: string){
  getAll(): Promise<BaseUserDto[]> {
    return this.usersService.findAll();
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
    return this.usersService.findOne(Number(userId));
  }
  @Post()
  create(@Body(ValidationPipe) user: CreateUserDto) {
    return this.usersService.create(user);
  }

  @Patch()
  update(@Param('id') id: string, @Body(ValidationPipe) user: UpdateUserDto) {
    return this.usersService.update(+id, user);
  }
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(+id);
  }
}
