// src/infraestructure/dtos/update-club.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

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
}
