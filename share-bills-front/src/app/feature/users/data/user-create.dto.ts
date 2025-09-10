import { IsEmail, IsString, IsStrongPassword } from 'class-validator';
import { UserDto } from './user.dto';

export class UserCreateDto{
    @IsString()
    name: string;
    @IsEmail()
    email: string;
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    passwordHash: string;

    constructor(entity: UserDto, password: string) {
        this.name = entity.name;
        this.email = entity.email;
        this.passwordHash = password;
    }
}