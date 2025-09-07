import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { GroupMember } from '../group-members/group-members.entity';
import { GroupMembersService } from '../group-members/group-members.service';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([GroupMember]),
  ],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    UsersService,
    GroupMembersService,
    StorageService
  ],
  exports: [GroupsService],
})
export class GroupsModule {}
