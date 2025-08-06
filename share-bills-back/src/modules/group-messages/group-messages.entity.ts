import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GroupMember } from '../group-members/group-members.entity';

@Entity('group_messages')
export class GroupMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GroupMember, member => member.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_member_id' })
  groupMember: GroupMember;

  @Column({ type: 'text', name: 'message_content' })
  messageContent: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'sent_at' })
  sentAt: Date;
}
