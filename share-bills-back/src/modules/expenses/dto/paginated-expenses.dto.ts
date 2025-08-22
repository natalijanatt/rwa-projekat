import { BaseExpenseDto } from "./base-expense.dto";

export type PaginatedExpenses = {
  items: BaseExpenseDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
