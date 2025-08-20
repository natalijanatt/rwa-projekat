import { BaseGroupMemberDto } from "src/modules/group-members/dto/BaseGroupMember.dto";
import { Group } from "../group.entity";
import { BaseUserDto } from "src/modules/users/dto/base-user.dto";
import { BaseGroupMemberBalanceDto } from "src/modules/group-members-balance/dto/base-gm-balance.dto";

export class FullGroupDto {
  id: number;
  name: string;
  imagePath?:string;
  owner: BaseUserDto;
  members: BaseGroupMemberDto[];
  balances: BaseGroupMemberBalanceDto[];

  constructor(entity: Group) {
    this.id = entity.id;
    this.name = entity.name;
    this.owner = entity.owner;
    this.imagePath = entity.imagePath;
    this.members = entity.members?.map(member => new BaseGroupMemberDto(member)) || [];
    this.balances = entity.balances?.map(balance => new BaseGroupMemberBalanceDto(balance)) || [];
  }
}
