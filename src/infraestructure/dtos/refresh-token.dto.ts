import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenInputDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RefreshTokenOutputDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
