export interface UserDto {
  id: number;
  name: string;
  email: string;
  imagePath: string;
  createdAt: Date;
  groupsOwned: number[];
  memberships: number[];
  expensesCount?: number;
}