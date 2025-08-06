import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, ValidationPipe, } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService){}
    @Get()
    // getAll(@Query('role') role?: string){
    getALl(){
        return this.usersService.findAll();
    }

    @Get(':id')
    getOne(@Param('id', ParseIntPipe) id:number){
        return {id}
    }
    @Post()
    create(@Body(ValidationPipe) user: CreateUserDto){
        return user;
    }

    @Patch()
    update(@Param('id') id:string, @Body() user: object){
        return {id, ... user}
    }
    @Delete(':id')
    delete(@Param('id') id:string){
        return id;
    }
}
