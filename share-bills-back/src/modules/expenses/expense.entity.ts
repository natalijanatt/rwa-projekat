import { Group } from 'src/modules/groups/group.entity';
import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Check
} from 'typeorm';
import { ExpenseShare } from 'src/modules/expense-shares/expense-shares.entity';

@Entity('expenses')
@Check(`"amount" >= 0`)
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Group, group => group.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'date', name: 'date_incurred' })
  dateIncurred: string;

  @ManyToOne(() => User, user => user.expensesPaid, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paid_by_id' })
  paidBy: User;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ExpenseShare, share => share.expense)
  shares: ExpenseShare[];
}