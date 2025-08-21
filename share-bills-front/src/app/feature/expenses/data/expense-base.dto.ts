import { GroupBaseDto } from "../../groups/data/group-base.dto";
import { GroupMemberBaseDto } from "../../groups/data/group-member-base.dto";

export interface BaseExpenseDto {
    id: number;
    title: string;
    amount: number;
    group: GroupBaseDto;
    groupId: number;
    paidBy: GroupMemberBaseDto;
    paidById: number;
    txnType: string;
    createdAt: Date;
    finalizedAt: Date | null;
}