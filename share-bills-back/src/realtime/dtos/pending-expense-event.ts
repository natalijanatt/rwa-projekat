import { ParticipantStatus } from "src/modules/expense-participants/expense-participants.entity";
import { Expense } from "src/modules/expenses/expense.entity";


export interface PendingExpenseEvent {
  expense: Partial<Expense>;
  paidByName: string;
  groupName: string;
  groupCurrencyCode: string;
  me: {
    memberId: number;
    status: ParticipantStatus | null;
  };
}
