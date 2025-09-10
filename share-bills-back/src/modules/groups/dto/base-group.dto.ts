import { Group } from "../group.entity";
import { BaseUserDto } from "src/modules/users/dto/base-user.dto";

export class BaseGroupDto {
  id: number;
  name: string;
  imagePath? : string;
  baseCurrencyCode: string;
  owner: BaseUserDto;

  constructor(entity: Group) {
    this.id = entity.id;
    this.imagePath = entity.imagePath;
    this.name = entity.name;
    this.baseCurrencyCode = entity.baseCurrencyCode;
    this.owner = entity.owner;
  }
}
