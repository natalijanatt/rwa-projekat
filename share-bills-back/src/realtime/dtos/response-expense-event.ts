import { ParticipantStatus } from "src/modules/expense-participants/expense-participants.entity";
import { Expense } from "src/modules/expenses/expense.entity";

export interface ResponseExpenseEvent {
    expense: Partial<Expense>;
    respondFrom: string;
    groupName: string;
    groupCurrencyCode: string;
    status: ParticipantStatus;
}