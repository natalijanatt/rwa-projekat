import {
  Body,
  ConflictException,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body(ValidationPipe) user: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(user.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    return this.authService.register(user);
  }
}
