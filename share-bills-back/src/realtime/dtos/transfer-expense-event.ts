import { Expense } from "src/modules/expenses/expense.entity";

export interface TransferExpenseEvent {
    expense: Partial<Expense>;
    transferFrom: string;
    groupName: string;
    groupCurrencyCode: string;
    amount: number;
}