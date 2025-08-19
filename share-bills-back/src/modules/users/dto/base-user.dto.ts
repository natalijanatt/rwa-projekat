import { User } from "../user.entity";
import { FullUserDto } from "./full-user.dto";

export class BaseUserDto {
    id:number;
    name:string;
    email:string;
    imagePath?: string;

    constructor(entity: User | FullUserDto){
        this.id = entity.id;
        this.name = entity.name;
        this.email = entity.email;
        this.imagePath = entity?.imagePath;
    }
}