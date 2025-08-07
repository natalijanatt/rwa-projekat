import { IsString } from 'class-validator';
import { User } from 'src/modules/users/user.entity';

export class CreateGroupDto {
  @IsString()
  name: string;
  owner: User;
}
