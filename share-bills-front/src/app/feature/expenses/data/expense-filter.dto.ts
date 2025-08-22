export interface ExpenseFilterDto {
  groupId?: number;
  status?: 'accepted' | 'declined';
  userId?: number;
  paidBy?: number;
  type?: 'expense' | 'transfer';
  ordredBy?: 'createdAt' | 'amount' | 'title';
  orderDirection?: 'ASC' | 'DESC';
  page?: number;
}