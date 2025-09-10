import { IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string;
  imagePath?: string;
  @IsString()
  baseCurrencyCode: string;
}
