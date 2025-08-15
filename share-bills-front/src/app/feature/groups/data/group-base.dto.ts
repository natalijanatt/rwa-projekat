import { UserBaseDto } from "../../users/data/user-base.dto";

export interface GroupBaseDto {
  id: number;
  name: string;
  owner: UserBaseDto;
}
