import {
  Body,
  ConflictException,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service';
import { LoginSwaggerDto } from '../../swagger/swagger-dto/login-swagger.dto';
import { CreateUserSwaggerDto } from '../../swagger/swagger-dto/create-user-swagger.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private storage: StorageService,
  ) {}

  @ApiOperation({ 
    summary: 'Prijavljivanje korisnika',
    description: 'Prijavljuje korisnika u sistem i vraća JWT token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Uspešno prijavljivanje',
    type: LoginSwaggerDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Neispravni kredencijali' 
  })
  @ApiBody({
    description: 'Podaci za prijavljivanje',
    type: LoginSwaggerDto
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @ApiOperation({ 
    summary: 'Registracija korisnika',
    description: 'Registruje novog korisnika u sistem sa opcionom slikom profila'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Korisnik je uspešno registrovan',
    type: CreateUserSwaggerDto
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email već postoji u sistemu' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Neispravni podaci' 
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Podaci za registraciju korisnika',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Ime korisnika',
          example: 'Natalija Nikolic'
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Email adresa',
          example: 'natalija@gmail.com'
        },
        password: {
          type: 'string',
          description: 'Lozinka',
          example: 'Admin123!'
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Slika profila (jpg, jpeg, png, webp)'
        }
      },
      required: ['name', 'email', 'password']
    }
  })
  @Post('register')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async register(
    @Body(ValidationPipe) user: CreateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    image?: Express.Multer.File,
  ) {
    const existingUser = await this.usersService.findByEmail(user.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const created = await this.authService.register(user);

    if (image) {
      const { path } = await this.storage.uploadUserAvatar(created.id, image);
      await this.usersService.updateAvatar(created.id, path);
    }

    return created;
  }
}
