import { UserBaseDto } from "../../users/data/user-base.dto";
import { GroupMemberBalanceBaseDto } from "./group-member-balance-base.dto";
import { GroupMemberBaseDto } from "./group-member-base.dto";

export interface GroupFullDto {
  id: number;
  name: string;
  imagePath?:string;
  baseCurrencyCode: string;
  owner: UserBaseDto;
  members: GroupMemberBaseDto[];
  balances: GroupMemberBalanceBaseDto[];
}