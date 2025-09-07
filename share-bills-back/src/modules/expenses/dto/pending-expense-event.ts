import { ParticipantStatus } from "src/modules/expense-participants/expense-participants.entity";
import { Expense } from "../expense.entity";

export interface PendingExpenseEvent {
  type: 'pending-expense';
  expense: Partial<Expense>;
  paidByName: string;
  groupName: string;
  me: {
    memberId: number;
    status: ParticipantStatus | null;
  };
}
