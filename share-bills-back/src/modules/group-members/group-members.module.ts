import { Module } from '@nestjs/common';
import { GroupMembersService } from './group-members.service';
import { GroupMembersController } from './group-members.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMember } from './group-members.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupMember])
  ],
  providers: [GroupMembersService],
  controllers: [GroupMembersController],
  exports: [GroupMembersService],
})
export class GroupMembersModule {}
