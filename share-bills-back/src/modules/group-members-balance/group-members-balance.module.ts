import { Module } from '@nestjs/common';
import { GroupMembersBalanceService } from './group-members-balance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMemberBalance } from './group-members-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupMemberBalance])],
  providers: [GroupMembersBalanceService]
})
export class GroupMembersBalanceModule {}
