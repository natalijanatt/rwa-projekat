import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { BaseUserDto } from './dto/base-user.dto';
import { FullUserDto } from './dto/full-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { FilterUserDto } from './dto/filter-user.dto';
import { ExpensesService } from '../expenses/expenses.service';
import { BaseService } from '../../common/services/base.service';
import { UserNotFoundException } from '../../common/exceptions/business.exceptions';
import { PAGINATION, COMMON_SELECT_FIELDS, getSelectFields } from '../../common/constants/pagination.constants';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @Inject(forwardRef(() => ExpensesService))
    private readonly expensesService: ExpensesService,
  ) {
    super(repo);
  }

  async findAll(filter?: FilterUserDto): Promise<BaseUserDto[]> {
    const qb = this.createBaseQueryBuilder('user')
      .select(getSelectFields('user', COMMON_SELECT_FIELDS.USER));
    
    this.applySearch(qb, {
      searchFields: ['name', 'email'],
      searchTerm: filter?.query
    });
    
    this.applyPagination(qb, { 
      limit: PAGINATION.USER_SEARCH_LIMIT, 
      orderBy: 'name', 
      orderDirection: 'DESC' 
    });
    
    const res = await qb.getMany();
    return res.map((r) => new BaseUserDto(r));
  }

  async findOne(id: number): Promise<FullUserDto> {
    const user: User | null = await this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.groupsOwned', 'groupsOwned')
      .leftJoinAndSelect('user.memberships', 'memberships')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      throw new UserNotFoundException(id);
    }
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
      throw new UserNotFoundException(id);
    }
    const updatedUser = this.repo.merge(existingUser, user);
    const savedUser = await this.repo.save(updatedUser);
    return new FullUserDto(savedUser);
  }

  async delete(id: number): Promise<void> {
    const existingUser = await this.repo.findOneBy({ id });
    if (!existingUser) {
      throw new UserNotFoundException(id);
    }
    await this.repo.delete(id);
  }

  async findByEmail(email: string): Promise<FullUserDto | null> {
    const user = await this.repo.findOneBy({ email });
    return user ? new FullUserDto(user) : null;
  }

  async findByEmailAuth(email: string): Promise<User | null> {
    return await this.repo.findOneBy({ email });
  }

  async updateAvatar(id: number, avatarPath: string): Promise<void> {
    const existingUser = await this.repo.findOneBy({ id });
    if (!existingUser) {
      throw new UserNotFoundException(id);
    }
    await this.repo.update({ id }, { imagePath: avatarPath });
  }
}
