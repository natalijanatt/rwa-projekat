import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Group } from '../groups/group.entity';
import { GroupMember } from '../group-members/group-members.entity';

@Entity({ name: 'group_member_balances' })
@Unique('uq_balance_unique_pair', ['groupId', 'fromMemberId', 'toMemberId'])
@Check('chk_balance_not_self', 'from_member_id <> to_member_id')
@Index('ix_balance_group', ['groupId'])
@Index('ix_balance_from', ['fromMemberId'])
@Index('ix_balance_to', ['toMemberId'])
export class GroupMemberBalance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'group_id', type: 'int' })
  groupId!: number;

  @Column({ name: 'from_member_id', type: 'int' })
  fromMemberId!: number;

  @Column({ name: 'to_member_id', type: 'int' })
  toMemberId!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  balance!: number;

  @ManyToOne(() => Group, (g) => g.balances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @ManyToOne(() => GroupMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_member_id' })
  fromMember!: GroupMember;

  @ManyToOne(() => GroupMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_member_id' })
  toMember!: GroupMember;
}
