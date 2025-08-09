/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { FullUserDto } from '../users/dto/full-user.dto';

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

    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const { password: _, ...result } = user;
      return result;
    }

   throw new BadRequestException('Incorrect password');
  }
  login(user: Partial<FullUserDto>): { access_token: string } {
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }
}
