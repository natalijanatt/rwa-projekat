import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { BaseUserDto } from './dto/base-user.dto';
import { NotFoundException } from '@nestjs/common';
import { FullUserDto } from './dto/full-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { FilterUserDto } from './dto/filter-user.dto';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly expensesService: ExpensesService,
  ) {}

  async findAll(filter? : FilterUserDto): Promise<BaseUserDto[]> {
    const res = await this.repo.createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.imagePath'])
      .where(filter?.query ? 'user.name LIKE :query OR user.email LIKE :query' : '1=1', {
        query: `%${filter?.query ?? ''}%`,
      })
      .take(5)
      .orderBy('user.name', 'DESC')
      .getMany();

    return res.map((r) => new BaseUserDto(r));
  }

  async findOne(id: number): Promise<FullUserDto | null> {
    const user: User | null = await this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.groupsOwned', 'groupsOwned')
      .leftJoinAndSelect('user.memberships', 'memberships')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const expensesCount = await this.expensesService.getExpenseCountForUser(id);
    return new FullUserDto(user);
  }

  async create(user: CreateUserDto): Promise<FullUserDto> {

    const hashedPassword: string = await bcrypt.hash(user.passwordHash, 10);
    const newUser = this.repo.create({ ...user, passwordHash: hashedPassword });
    const savedUser = await this.repo.save(newUser);
    return new FullUserDto(savedUser);
  }

  async update(id: number, user: UpdateUserDto): Promise<FullUserDto> {
    const existingUser = await this.repo.findOneBy({ id });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const updatedUser = this.repo.merge(existingUser, user);
    const savedUser = await this.repo.save(updatedUser);
    return new FullUserDto(savedUser);
  }
  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findByEmail(email: string): Promise<FullUserDto | null> {
    const user = await this.repo.findOneBy({ email });
    return user ? new FullUserDto(user) : null;
  }

  async updateAvatar(id: number, avatarPath: string) {
      return await this.repo.update(
        { id },
        { imagePath: avatarPath }
      )
  }
}
