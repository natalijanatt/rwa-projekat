import { BaseGroupMemberDto } from "src/modules/group-members/dto/BaseGroupMember.dto";
import { Group } from "../group.entity";
import { BaseUserDto } from "src/modules/users/dto/base-user.dto";

export class FullGroupDto {
  id: number;
  name: string;
  owner: BaseUserDto;
  members: BaseGroupMemberDto[];

  constructor(entity: Group) {
    this.id = entity.id;
    this.name = entity.name;
    this.owner = entity.owner;
    this.members = entity.members?.map(member => new BaseGroupMemberDto(member));
  }
}
