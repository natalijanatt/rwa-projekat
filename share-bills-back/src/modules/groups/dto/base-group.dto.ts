import { Group } from "../group.entity";
import { BaseUserDto } from "src/modules/users/dto/base-user.dto";

export class BaseGroupDto {
  id: number;
  name: string;
  owner: BaseUserDto;

  constructor(entity: Group) {
    this.id = entity.id;
    this.name = entity.name;
    this.owner = entity.owner;
  }
}
