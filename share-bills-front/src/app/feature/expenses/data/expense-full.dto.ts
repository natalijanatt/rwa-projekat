import { GroupBaseDto } from "../../groups/data/group-base.dto";
import { GroupMemberBaseDto } from "../../groups/data/group-member-base.dto";

export interface FullExpenseDto {
    id: number;
    groupId: number;
    paidById: number;
    paidToId: number | null;
    title: string;
    amount: number;
    txnType: string;
    dateIncurred: string;
    createdAt: Date;
    finalizedAt: Date | null;
    paidBy: GroupMemberBaseDto;
    group: GroupBaseDto;
    participantsCount: number;
    participants: GroupMemberBaseDto[];
}