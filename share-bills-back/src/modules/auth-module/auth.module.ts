import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [
    PassportModule,
    //?
    JwtModule.register({
      secret: 'your_jwt_secret', //! Use env later
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User]),
    forwardRef(() => UsersModule)
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, StorageService], 
    exports: [AuthService, JwtModule],
})
export class AuthModule {}