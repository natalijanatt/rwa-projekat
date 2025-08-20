export interface GroupMemberBalanceBaseDto {
  id: number;
  groupId: number;
  fromMemberId: number;
  toMemberId: number;
  balance: number;
}