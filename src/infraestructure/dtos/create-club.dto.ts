// src/infraestructure/dtos/create-club.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class CreateClubDto {
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
