import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseUserSwaggerDto {
    @ApiProperty({
        description: 'Jedinstveni identifikator korisnika',
        example: 1,
        type: 'integer'
    })
    id: number;

    @ApiProperty({
        description: 'Ime korisnika',
        example: 'Marko Petrović',
        maxLength: 100
    })
    name: string;

    @ApiProperty({
        description: 'Email adresa korisnika',
        example: 'marko.petrovic@example.com',
        format: 'email'
    })
    email: string;

    @ApiPropertyOptional({
        description: 'Putanja do slike profila korisnika',
        example: 'https://example.com/avatars/user123.jpg'
    })
    imagePath?: string;
}

