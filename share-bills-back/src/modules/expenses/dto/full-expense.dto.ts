import { Expense, TxnType } from "../expense.entity";
import { BaseGroupMemberDto } from "src/modules/group-members/dto/BaseGroupMember.dto";
import { GroupMember } from "src/modules/group-members/group-members.entity";
import { BaseGroupDto } from "src/modules/groups/dto/base-group.dto";

export class FullExpenseDto {
    id: number;
    groupId: number;
    paidById: number;
    paidToId: number | null;
    title: string;
    amount: number;
    txnType: TxnType;
    dateIncurred: string;
    createdAt: Date;
    finalizedAt: Date | null;
    paidBy: BaseGroupMemberDto;
    group: BaseGroupDto;
    participantsCount: number;
    participants: BaseGroupMemberDto[];

    constructor(expense: Expense, participantsCount: number = 0, participants: GroupMember[] = []) {
        this.id = expense.id;
        this.groupId = expense.groupId;
        this.paidById = expense.paidById;
        this.paidToId = expense.paidToId;
        this.title = expense.title;
        this.amount = expense.amount;
        this.txnType = expense.txnType;
        this.dateIncurred = expense.dateIncurred;
        this.createdAt = expense.createdAt;
        this.finalizedAt = expense.finalizedAt;
        this.paidBy = new BaseGroupMemberDto(expense.paidBy);
        this.group = new BaseGroupDto(expense.group);
        this.participantsCount = participantsCount;
        this.participants = participants.map(participant => new BaseGroupMemberDto(participant));
    }
}