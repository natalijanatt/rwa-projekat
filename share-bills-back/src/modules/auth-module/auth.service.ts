/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { FullUserDto } from '../users/dto/full-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<FullUserDto> | null> {
    if (!email || !password) {
      return null;
    }

    const user = await this.usersService.findByEmailAuth(email);

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (isPasswordValid) {
      const { ...result } = user;
      return new FullUserDto(result);
    }

    throw new BadRequestException('Incorrect password');
  }
  login(user: Partial<FullUserDto>): { access_token: string } {
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }

  async register(user: CreateUserDto): Promise<FullUserDto> {
    return this.usersService.create(user);
  }
}
