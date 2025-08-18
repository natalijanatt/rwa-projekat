export interface UserDto {
  id: number;
  name: string;
  email: string;
  password: string;
  imagePath: string;
  createdAt: Date;
  groupsOwned: number[];
  memberships: number[];
}