import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Unique, CreateDateColumn, Check, Index,
} from 'typeorm';
import { Group } from '../groups/group.entity';
import { User } from '../users/user.entity';
import { GroupMessage } from '../group-messages/group-messages.entity';
import { Expense } from '../expenses/expense.entity';
import { ExpenseShare } from '../expense-shares/expense-shares.entity';

@Unique(['groupId', 'userId'])
@Unique('uq_group_members_id_group', ['id', 'groupId'])
@Check(`(has_left AND left_at IS NOT NULL) OR (NOT has_left AND left_at IS NULL)`)
@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'group_id' })
  groupId: number;

  @ManyToOne(() => Group, (g) => g.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Index()
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (u) => u.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz', default: () => 'NOW()' })
  joinedAt: Date;

  @Column({ name: 'has_left', type: 'boolean', default: false })
  hasLeft: boolean;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt: Date | null;

  @OneToMany(() => GroupMessage, (m) => m.member)
  messages: GroupMessage[];

  @OneToMany(() => Expense, (e) => e.paidBy)
  expensesPaidBy: Expense[];

  @OneToMany(() => Expense, (e) => e.paidTo)
  expensesPaidTo: Expense[];

  @OneToMany(() => ExpenseShare, (s) => s.member)
  sharesAsDebtor: ExpenseShare[];

  @OneToMany(() => ExpenseShare, (s) => s.owedTo)
  sharesAsCreditor: ExpenseShare[];
}
