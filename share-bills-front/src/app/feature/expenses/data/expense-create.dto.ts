export interface CreateExpenseDto {
  groupId: number;
  paidToId?: number | null;
  title: string;
  amount: number;
  dateIncurred: string;
  txnType: 'expense' | 'transfer';
}
