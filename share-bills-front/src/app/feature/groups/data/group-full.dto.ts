import { UserBaseDto } from "../../users/data/user-base.dto";
import { GroupMemberBaseDto } from "./group-member-base.dto";

export interface GroupFullDto {
  id: number;
  name: string;
  imagePath?:string;
  owner: UserBaseDto;
  members: GroupMemberBaseDto[];
}