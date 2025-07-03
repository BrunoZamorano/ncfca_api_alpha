import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutInputDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
