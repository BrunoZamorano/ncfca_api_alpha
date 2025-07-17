// src/infraestructure/dtos/update-profile.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Novo primeiro nome do usuário.',
    example: 'José',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Novo último nome do usuário.',
    example: 'Ribeiro',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Novo telefone de contato do usuário.',
    example: '5521998877665',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Novo email de contato do usuário.',
    example: 'jose.ribeiro@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
