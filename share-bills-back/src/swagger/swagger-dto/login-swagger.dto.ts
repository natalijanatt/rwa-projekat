import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginSwaggerDto {
    @ApiProperty({
        description: 'Email adresa korisnika',
        example: 'natalija@gmail.com',
        format: 'email'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Lozinka korisnika',
        example: 'Admin123!',
        minLength: 1
    })
    @IsString()
    @MinLength(1)
    password: string;
}

