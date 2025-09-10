import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth-module/auth.module';
import { StorageService } from '../storage/storage.service';
import { ExpensesModule } from '../expenses/expenses.module';
import { GroupsModule } from '../groups/groups.module';
import { UserValidationService } from '../../common/services/user-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), 
    forwardRef(() => AuthModule),
    forwardRef(() => ExpensesModule),
    forwardRef(() => GroupsModule)
  ],
  providers: [UsersService, StorageService, UserValidationService],
  controllers: [UsersController], 
  exports: [UsersService],
})
export class UsersModule {}
