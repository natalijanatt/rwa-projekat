import { GroupMemberBalance } from "../group-members-balance.entity";

export class BaseGroupMemberBalanceDto {
    id: number;
    groupId: number;
    fromMemberId: number;
    toMemberId: number;
    balance: number;

    constructor(entity: GroupMemberBalance) {
        this.id = entity.id;
        this.groupId = entity.groupId;
        this.fromMemberId = entity.fromMemberId;
        this.toMemberId = entity.toMemberId;
        this.balance = entity.balance;
    }
}