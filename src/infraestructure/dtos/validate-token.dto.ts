import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ValidateTokenInputDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ValidateTokenOutputDto {
  @IsString()
  @IsNotEmpty()
  familyId: string;

  @IsString({ each: true })
  @IsNotEmpty()
  roles: string[];

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  sub: string;

  @IsNumber()
  @IsNotEmpty()
  iat: number;

  @IsNumber()
  @IsNotEmpty()
  exp: number;
}
