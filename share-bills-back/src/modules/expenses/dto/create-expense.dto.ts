import { IsInt, IsNumber, IsOptional, IsString, IsIn, IsDateString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsInt() groupId: number;
  @IsOptional() @IsInt() paidToId?: number | null;
  @IsString() title: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsDateString() dateIncurred: string;
  @IsIn(['expense','transfer']) txnType: 'expense' | 'transfer';
}
