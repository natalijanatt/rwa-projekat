import { User } from "src/modules/users/user.entity";
import { Group } from "../group.entity";

export class BaseGroupDto {
  id: number;
  name: string;
  owner: User;

  constructor(entity: Group) {
    this.id = entity.id;
    this.name = entity.name;
    this.owner = entity.owner;
  }
}
