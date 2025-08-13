export interface UserDto {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  groupsOwned: number[];
  memberships: number[];
}