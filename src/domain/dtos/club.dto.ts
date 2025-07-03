import { IsNotEmpty, IsString } from 'class-validator';

export default class ClubDto {
  @IsNotEmpty()
  @IsString()
  affiliatedFamilies: string[];

  @IsNotEmpty()
  @IsString()
  ownerId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  id: string;
}
