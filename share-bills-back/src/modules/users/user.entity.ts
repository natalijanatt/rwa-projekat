import { Expense } from 'src/modules/expenses/expense.entity';
import { ExpenseShare } from 'src/modules/expense-shares/expense-shares.entity';
import { Group } from 'src/modules/groups/group.entity';
import { GroupMember } from '../group-members/group-members.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
 
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Group, group => group.owner)
  groups: Group[];

  @OneToMany(() => GroupMember, member => member.user)
  groupMembers: GroupMember[];

  @OneToMany(() => Expense, expense => expense.paidBy)
  expensesPaid: Expense[];

  @OneToMany(() => ExpenseShare, share => share.user)
  expenseShares: ExpenseShare[];
}