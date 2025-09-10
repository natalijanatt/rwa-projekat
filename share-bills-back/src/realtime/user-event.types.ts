import { FinalizedExpenseEvent } from "./dtos/finalized-expense-event";
import { PendingExpenseEvent } from "./dtos/pending-expense-event";
import { ResponseExpenseEvent } from "./dtos/response-expense-event";
import { TransferExpenseEvent } from "./dtos/transfer-expense-event";


export type UserEvent =
  | { type: 'heartbeat'; data: string }
  | { type: 'open'; data: 'ready' }
  | { type: 'expense.pending'; data: PendingExpenseEvent }
  | { type: 'expense.responded'; data: ResponseExpenseEvent } 
  | { type: 'expense.transferred'; data: TransferExpenseEvent }
  | { type: 'expense.finalized'; data: FinalizedExpenseEvent };

export type EventType = UserEvent['type'];
