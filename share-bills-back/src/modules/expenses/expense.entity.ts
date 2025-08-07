import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Index, Unique, Check, CreateDateColumn,
} from 'typeorm';
import { Group } from '../groups/group.entity';
import { GroupMember } from '../group-members/group-members.entity';
import { ExpenseShare } from '../expense-shares/expense-shares.entity';

export enum TxnType {
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

@Unique(['id', 'groupId'])
@Unique(['id', 'paidById'])
@Check(`(txn_type = 'expense' AND paid_to IS NULL) OR (txn_type = 'transfer' AND paid_to IS NOT NULL)`)
@Check(`txn_type <> 'transfer' OR paid_by_id <> paid_to`)
@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'group_id' })
  groupId: number;

  @ManyToOne(() => Group, (g) => g.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Index()
  @Column({ name: 'paid_by_id' })
  paidById: number;

  @ManyToOne(() => GroupMember, (gm) => gm.expensesPaidBy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paid_by_id' })
  paidBy: GroupMember;

  @Index()
  @Column({ name: 'paid_to', nullable: true })
  paidToId: number | null;

  @ManyToOne(() => GroupMember, (gm) => gm.expensesPaidTo, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paid_to' })
  paidTo: GroupMember | null;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'numeric', precision: 12, scale: 2})
  amount: number;

  @Column({ name: 'date_incurred', type: 'date' })
  dateIncurred: string;

  @Column({ name: 'txn_type', type: 'text', default: TxnType.EXPENSE })
  txnType: TxnType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @OneToMany(() => ExpenseShare, (s) => s.expense)
  shares: ExpenseShare[];
}
