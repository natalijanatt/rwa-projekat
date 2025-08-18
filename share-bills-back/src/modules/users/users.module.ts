import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth-module/auth.module';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), AuthModule
  ],
  providers: [UsersService, StorageService],
  controllers: [UsersController], 
  exports: [UsersService],
})
export class UsersModule {}
