import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClubInputDto {
  @ApiProperty({
    description: 'Nome do novo clube.',
    example: 'Clube de Debate Oradores do Amanhã',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Cidade onde o clube está localizado.',
    example: 'Brasília',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  city: string;

  @ApiProperty({
    description: 'Estado onde o clube está localizado.',
    example: 'DF',
    maxLength: 2,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2)
  state: string;
}

export class CreateClubOutputDto {
  @ApiProperty({
    description: 'Nome do novo clube.',
    example: 'Clube de Debate Oradores do Amanhã',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Cidade onde o clube está localizado.',
    example: 'Brasília',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  city: string;

  @ApiProperty({
    description: 'Estado onde o clube está localizado.',
    example: 'DF',
    maxLength: 2,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2)
  state: string;

  @ApiProperty({ description: 'Novo token de acesso JWT.' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Novo token de atualização.' })
  @IsString()
  refreshToken: string;
}
