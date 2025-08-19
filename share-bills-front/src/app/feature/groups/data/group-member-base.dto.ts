import { UserBaseDto } from "../../users/data/user-base.dto";

export interface GroupMemberBaseDto {
    id: number;
    userId: number;
    user: UserBaseDto;
}