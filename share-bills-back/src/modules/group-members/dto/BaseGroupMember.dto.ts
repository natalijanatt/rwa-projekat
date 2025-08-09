import { BaseUserDto } from "src/modules/users/dto/base-user.dto";
import { GroupMember } from "../group-members.entity";

export class BaseGroupMemberDto {
    id: number;
    userId: number;
    user: BaseUserDto;

    constructor(body: GroupMember) {
        this.id = body.id;
        this.userId = body.userId;
        this.user = new BaseUserDto(body.user);
    }
}
