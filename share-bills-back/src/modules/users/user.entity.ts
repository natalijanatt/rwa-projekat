import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany
} from 'typeorm';
import { Group } from '../groups/group.entity';
import { GroupMember } from '../group-members/group-members.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @OneToMany(() => Group, (g) => g.owner)
  groupsOwned: Group[];

  @OneToMany(() => GroupMember, (gm) => gm.user)
  memberships: GroupMember[];
}
