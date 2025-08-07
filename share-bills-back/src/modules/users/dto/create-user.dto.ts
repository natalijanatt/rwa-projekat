import { IsEmail, IsString } from "@nestjs/class-validator";
import { IsStrongPassword } from "class-validator";

export class CreateUserDto{
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
}