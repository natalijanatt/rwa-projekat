import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, Check,
} from 'typeorm';
import { User } from '../users/user.entity';
import { GroupMember } from '../group-members/group-members.entity';
import { GroupMessage } from '../group-messages/group-messages.entity';
import { Expense } from '../expenses/expense.entity';
import { GroupMemberBalance } from '../group-members-balance/group-members-balance.entity';

@Check(`(is_deleted AND deleted_at IS NOT NULL) OR (NOT is_deleted AND deleted_at IS NULL)`)
@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Index()
  @Column({ name: 'owner_id' })
  ownerId: number;

  @ManyToOne(() => User, (u) => u.groupsOwned, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({name: 'image_path', nullable: true})
  imagePath: string;

  @Column({name: 'base_currency_code', length: 3})
  baseCurrencyCode: string;
  
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @OneToMany(() => GroupMember, (gm) => gm.group)
  members: GroupMember[];

  @OneToMany(() => GroupMessage, (m) => m.group)
  messages: GroupMessage[];

  @OneToMany(() => Expense, (e) => e.group)
  expenses: Expense[];

  @OneToMany(() => GroupMemberBalance, (b) => b.group)
  balances: GroupMemberBalance[];
}
