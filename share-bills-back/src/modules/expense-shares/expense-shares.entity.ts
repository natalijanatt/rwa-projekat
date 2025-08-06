import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check
} from 'typeorm';
import { Expense } from '../expenses/expense.entity';
import { User } from 'src/modules/users/user.entity';

@Entity('expense_shares')
@Check(`"owed_amount" >= 0`)
export class ExpenseShare {
  @PrimaryColumn({ type: 'int', name: 'expense_id' })
  expenseId: number;

  @PrimaryColumn({ type: 'int', name: 'user_id' })
  userId: number;

  @ManyToOne(() => Expense, expense => expense.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @ManyToOne(() => User, user => user.expenseShares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'owed_amount' })
  owedAmount: string;

  @Column({ type: 'boolean', default: false })
  settled: boolean;

  @Column({ type: 'timestamptz', name: 'settled_at', nullable: true })
  settledAt: Date | null;
}