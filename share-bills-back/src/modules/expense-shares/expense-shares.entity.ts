import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index,
} from 'typeorm';
import { Expense } from '../expenses/expense.entity';
import { GroupMember } from '../group-members/group-members.entity';

@Unique('uq_share_unique_per_expense_member', ['expenseId', 'memberId'])
@Entity('expense_shares')
export class ExpenseShare {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'group_id' })
  groupId: number;

  @Index()
  @Column({ name: 'expense_id' })
  expenseId: number;

  @ManyToOne(() => Expense, (e) => e.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @Index()
  @Column({ name: 'member_id' })
  memberId: number;

  @ManyToOne(() => GroupMember, (gm) => gm.sharesAsDebtor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: GroupMember;

  @Index()
  @Column({ name: 'owed_to_member_id' })
  owedToMemberId: number;

  @ManyToOne(() => GroupMember, (gm) => gm.sharesAsCreditor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owed_to_member_id' })
  owedTo: GroupMember;

  @Column({ name: 'owed_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  owedAmount: number;

  @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
