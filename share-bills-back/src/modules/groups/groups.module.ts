import { Module, forwardRef } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { GroupMember } from '../group-members/group-members.entity';
import { GroupMembersService } from '../group-members/group-members.service';
import { StorageService } from '../storage/storage.service';
import { UserValidationService } from '../../common/services/user-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([GroupMember]),
    forwardRef(() => UsersModule)
  ],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupMembersService,
    StorageService,
    UserValidationService
  ],
  exports: [GroupsService],
})
export class GroupsModule {}
