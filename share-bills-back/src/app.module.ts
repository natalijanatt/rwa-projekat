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
import { ExpenseParticipantsController } from './modules/expense-participants/expense-participants.controller';
import { ExpenseParticipantsModule } from './modules/expense-participants/expense-participants.module';
import { GroupsModule } from './modules/groups/groups.module';
import { GroupMembersBalanceModule } from './modules/group-members-balance/group-members-balance.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { LoggerModule } from 'nestjs-pino';

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
      LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                translateTime: 'SYS:HH:MM:ss.l',
                singleLine: false,
              },
            },
        serializers: {
          req: (req: import('express').Request & { id?: string }) => ({ method: req.method, url: req.url, id: req.id }),
          res: (res: import('express').Response) => ({ statusCode: res.statusCode }),
        },
      },
    }),
    UsersModule,
    AuthModule,
    ThrottlerModule.forRoot(),
    GroupMembersModule,
    ExpenseParticipantsModule,
    GroupsModule,
    GroupMembersBalanceModule,
    ExpensesModule
  ],
  controllers: [AppController, ExpenseParticipantsController],
  providers: [AppService, {provide: 'APP_GUARD', useClass: ThrottlerGuard}],
})
export class AppModule {}
