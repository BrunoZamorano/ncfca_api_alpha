import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateClubDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  city?: string;
}