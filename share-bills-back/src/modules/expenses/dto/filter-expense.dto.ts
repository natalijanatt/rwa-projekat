import { ParticipantStatus } from "src/modules/expense-participants/expense-participants.entity";
import { TxnType } from "../expense.entity";

export class FilterExpenseDto {
    groupId?: number;
    status?: ParticipantStatus;
    type?: TxnType;
    paidBy?: number;
    ordredBy?: 'createdAt' | 'amount' | 'title';
    orderDirection?: 'ASC' | 'DESC';
    page?: number;

    constructor(partial: Partial<FilterExpenseDto>) {
        this.groupId = partial.groupId;
        this.status = partial.status;
        this.type = partial.type;
        this.paidBy = partial.paidBy;
        this.ordredBy = partial.ordredBy || 'createdAt';
        this.orderDirection = partial.orderDirection || 'DESC';
        this.page = partial.page || 1; 
    }
}