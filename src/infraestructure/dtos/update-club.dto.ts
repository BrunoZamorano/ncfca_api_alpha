// src/infraestructure/dtos/update-club.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class UpdateClubDto {
  @ApiPropertyOptional({
    description: 'Novo nome do clube.',
    example: 'Clube de Oratória Avançada',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({
    description: 'Nova cidade de localização do clube.',
    example: 'São Paulo',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  city?: string;

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
