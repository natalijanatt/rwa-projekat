import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Group } from '../groups/group.entity';
import { User } from 'src/modules/users/user.entity';
import { GroupMessage } from '../group-messages/group-messages.entity';

@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Group, group => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, user => user.groupMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz', name: 'joined_at' })
  joinedAt: Date;

  @Column({ type: 'boolean', default: false })
  left: boolean;

  @Column({ type: 'timestamptz', name: 'left_at', nullable: true })
  leftAt: Date | null;

  @OneToMany(() => GroupMessage, message => message.groupMember)
  messages: GroupMessage[];
}