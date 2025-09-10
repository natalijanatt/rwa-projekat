import { Expense } from "src/modules/expenses/expense.entity";

export interface FinalizedExpenseEvent {
        expense: Partial<Expense>;
        expensePartcipantsCount: number;
        groupName: string;
        groupCurrencyCode: string;
}