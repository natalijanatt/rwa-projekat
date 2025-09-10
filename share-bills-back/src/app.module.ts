import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth-module/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GroupMembersModule } from './modules/group-members/group-members.module';
import { ExpenseParticipantsModule } from './modules/expense-participants/expense-participants.module';
import { GroupsModule } from './modules/groups/groups.module';
import { GroupMembersBalanceModule } from './modules/group-members-balance/group-members-balance.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { MulterModule } from '@nestjs/platform-express';
import { StorageService } from './modules/storage/storage.service';
import { RealtimeModule } from './realtime/realtime.module';
import { SwaggerModule } from './swagger/swagger.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST')!,
        port: +config.get<string>('DB_PORT')!,
        username: config.get<string>('DB_USERNAME')!,
        password: config.get<string>('DB_PASSWORD')!,
        database: config.get<string>('DB_DATABASE')!,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    MulterModule.register({limits: { fileSize: 5 * 1024 * 1024 }}),
    UsersModule,
    AuthModule,
    ThrottlerModule.forRoot(),
    GroupMembersModule,
    ExpenseParticipantsModule,
    GroupsModule,
    GroupMembersBalanceModule,
    ExpensesModule,
    RealtimeModule,
    SwaggerModule
  ],
  controllers: [AppController],
  providers: [AppService, {provide: 'APP_GUARD', useClass: ThrottlerGuard}, StorageService],
})
export class AppModule {}
