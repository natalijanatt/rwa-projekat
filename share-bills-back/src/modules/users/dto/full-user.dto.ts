import { User } from '../user.entity';

export class FullUserDto {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  groupsOwned: number[];
  memberships: number[];

  constructor(entity: User) {
    this.id = entity.id;
    this.name = entity.name;
    this.email = entity.email;
    this.password = entity.passwordHash;
    this.createdAt = entity.createdAt;
    this.groupsOwned = entity.groupsOwned?.map((g) => g.id);
    this.memberships = entity.memberships?.map((gm) => gm.group.id);
  }
}
