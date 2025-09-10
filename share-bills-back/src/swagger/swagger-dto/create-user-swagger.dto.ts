import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString } from "@nestjs/class-validator";
import { IsStrongPassword } from "class-validator";

export class CreateUserSwaggerDto {
    @ApiProperty({
        description: 'Ime korisnika',
        example: 'Marko Petrović',
        minLength: 1,
        maxLength: 100
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Email adresa korisnika',
        example: 'marko.petrovic@example.com',
        format: 'email'
    })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({
        description: 'Putanja do slike profila korisnika',
        example: 'avatars/user123.jpg'
    })
    imagePath?: string;

    @ApiProperty({
        description: 'Lozinka korisnika - mora imati najmanje 8 karaktera, 1 malo slovo, 1 veliko slovo, 1 broj i 1 simbol',
        example: 'SecurePass123!',
        minLength: 8
    })
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    passwordHash: string;
}

