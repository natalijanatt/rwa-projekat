import { BaseGroupDto } from "src/modules/groups/dto/base-group.dto";
import { Expense } from "../expense.entity";
import { BaseGroupMemberDto } from "src/modules/group-members/dto/BaseGroupMember.dto";

export class BaseExpenseDto {
    id: number;
    title: string;
    amount: number;
    group: BaseGroupDto;
    groupId: number;
    paidBy: BaseGroupMemberDto;
    paidById: number;
    txnType: string;
    createdAt: Date;
    finalizedAt: Date | null;

    constructor(entity: Expense) {
        this.id = entity.id;
        this.title = entity.title;
        this.amount = entity.amount;
        this.groupId = entity.groupId;
        this.paidById = entity.paidById;
        this.group = new BaseGroupDto(entity?.group);
        this.paidBy = new BaseGroupMemberDto(entity?.paidBy);
        this.txnType = entity.txnType;
        this.createdAt = entity.createdAt;
        this.finalizedAt = entity.finalizedAt;
    }
}