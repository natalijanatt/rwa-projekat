import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, Unique, Check, CreateDateColumn, JoinColumn
} from 'typeorm';
import { Expense } from '../expenses/expense.entity';
import { GroupMember } from '../group-members/group-members.entity';
export enum ParticipantStatus {
  Pending  = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
  Removed  = 'removed',
}

@Entity({ name: 'expense_participants' })
@Unique('uq_participant', ['expenseId', 'memberId'])
@Check(
  'chk_part_responded_at',
  `(status = 'pending' AND responded_at IS NULL)
   OR (status IN ('accepted','declined','removed') AND responded_at IS NOT NULL)`
)
@Index('ix_participants_expense', ['expenseId'])
@Index('ix_participants_member', ['memberId'])
@Index('ix_participants_status', ['status'])
export class ExpenseParticipant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'expense_id', type: 'int' })
  expenseId!: number;

  @Column({ name: 'group_id', type: 'int' })
  groupId!: number;

  @Column({ name: 'member_id', type: 'int' })
  memberId!: number;

  @Column({ name: 'invited_by_member_id', type: 'int' })
  invitedByMemberId!: number;

  @Column({ type: 'text', default: ParticipantStatus.Pending })
  status!: ParticipantStatus;

  @CreateDateColumn({ name: 'invited_at', type: 'timestamptz', default: () => 'now()' })
  invitedAt!: Date;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date | null = null;

  // Composite FK to Expense: (expense_id, group_id) -> (Expense.id, Expense.groupId)
  @ManyToOne(() => Expense, (e) => e.participants, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'expense_id', referencedColumnName: 'id' },
    { name: 'group_id',   referencedColumnName: 'groupId' },
  ])
  expense!: Expense;

  // Composite FK to GroupMember: (member_id, group_id) -> (GroupMember.id, GroupMember.groupId)
  @ManyToOne(() => GroupMember, (m) => m.participations, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'member_id', referencedColumnName: 'id' },
    { name: 'group_id',  referencedColumnName: 'groupId' },
  ])
  member!: GroupMember;

  // Composite FK to inviter: (invited_by_member_id, group_id) -> (GroupMember.id, GroupMember.groupId)
  @ManyToOne(() => GroupMember, (m) => m.invitedParticipations, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'invited_by_member_id', referencedColumnName: 'id' },
    { name: 'group_id',             referencedColumnName: 'groupId' },
  ])
  invitedBy!: GroupMember;
}
