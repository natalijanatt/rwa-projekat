export interface PendingExpenseEvent {
  expense: {
    id: number;
    title: string;
    amount: number;
    groupId: number;
    paidById: number;
  };
  paidByName: string;
  groupName: string;
  groupCurrencyCode: string;
  me: { memberId: number; status: 'pending' | 'accepted' | 'declined' | null };
}

export interface ResponseExpenseEvent {
  expense: {
    id: number;
    title: string;
    amount: number;
    groupId: number;
    paidById: number;
  };
  respondFrom: string;
  groupName: string;
  groupCurrencyCode: string;
  status: 'accepted' | 'declined';
}

export interface TransferExpenseEvent {
  expense: {
    id: number;
    title: string;
    amount: number;
    groupId: number;
    paidById: number;
  };
  transferFrom: string;
  groupName: string;
  groupCurrencyCode: string;
  amount: number;
}

export interface FinalizedExpenseEvent {
  expense: {
    id: number;
    title: string;
    amount: number;
    groupId: number;
    paidById: number;
  };
  expensePartcipantsCount: number; // This is the acceptedCount
  groupName: string;
  groupCurrencyCode: string;
}

export type UserEvent =
  | { type: 'heartbeat'; data: string }
  | { type: 'open'; data: 'ready' }
  | { type: 'expense.pending'; data: PendingExpenseEvent }
  | { type: 'expense.responded'; data: ResponseExpenseEvent }
  | { type: 'expense.transferred'; data: TransferExpenseEvent }
  | { type: 'expense.finalized'; data: FinalizedExpenseEvent };

export type RealtimeEventType = UserEvent['type'];

export const isType =
  <T extends RealtimeEventType>(t: T) =>
  (e: UserEvent): e is Extract<UserEvent, { type: T }> =>
    e?.type === t;
