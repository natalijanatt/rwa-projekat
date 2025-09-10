import { Module } from '@nestjs/common';
import { UsersSwaggerController } from './swagger-controllers/users-swagger.controller';
import { GroupsSwaggerController } from './swagger-controllers/groups-swagger.controller';
import { UsersModule } from '../modules/users/users.module';
import { GroupsModule } from '../modules/groups/groups.module';
import { GroupMembersModule } from '../modules/group-members/group-members.module';
import { ExpensesModule } from '../modules/expenses/expenses.module';
import { ExpenseParticipantsModule } from '../modules/expense-participants/expense-participants.module';
import { AuthModule } from '../modules/auth-module/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StorageService } from '../modules/storage/storage.service';

@Module({
  imports: [
    UsersModule,
    GroupsModule,
    GroupMembersModule,
    ExpensesModule,
    ExpenseParticipantsModule,
    AuthModule,
    RealtimeModule,
  ],
  controllers: [
    UsersSwaggerController,
    GroupsSwaggerController,
  ],
  providers: [StorageService],
})
export class SwaggerModule {}

