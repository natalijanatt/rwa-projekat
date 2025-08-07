import { User } from "../user.entity";

export class BaseUserDto {
    id:number;
    name:string;
    email:string;

    constructor(entity: User){
        this.id = entity.id;
        this.name = entity.name;
        this.email = entity.email;
    }
}