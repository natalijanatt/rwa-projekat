import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Group } from '../groups/group.entity';
import { GroupMember } from '../group-members/group-members.entity';

@Entity('group_messages')
export class GroupMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'group_id' })
  groupId: number;

  @ManyToOne(() => Group, (g) => g.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_members_id' })
  memberId: number;

  // DB has a composite FK (group_members_id, group_id) → group_members(id, group_id).
  // We join by member primary key; DB enforces the group match.
  @ManyToOne(() => GroupMember, (gm) => gm.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_members_id' })
  member: GroupMember;

  @Column({ name: 'message_content', type: 'text' })
  messageContent: string;

  @Column({ name: 'sent_at', type: 'timestamptz', default: () => 'NOW()' })
  sentAt: Date;
}
