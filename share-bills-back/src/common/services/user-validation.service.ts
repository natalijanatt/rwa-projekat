import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class UserValidationService {
  constructor(private readonly usersService: UsersService) {}

  async validateUserExists(userId: number): Promise<void> {
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  async validateUserEmail(email: string): Promise<void> {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Invalid email address');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  validateUserId(userId: any): number {
    const id = Number(userId);
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid user ID format');
    }
    return id;
  }
}

