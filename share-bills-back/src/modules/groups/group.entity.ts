import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { GroupMember } from '../group-members/group-members.entity';
import { Expense } from 'src/modules/expenses/expense.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => User, user => user.groups, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;

  @OneToMany(() => GroupMember, member => member.group)
  members: GroupMember[];

  @OneToMany(() => Expense, expense => expense.group)
  expenses: Expense[];
}