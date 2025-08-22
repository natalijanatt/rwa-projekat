import { ExpenseBaseDto } from "./expense-base.dto";

export interface ExpensePaginatedDto {
    items: ExpenseBaseDto[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
}