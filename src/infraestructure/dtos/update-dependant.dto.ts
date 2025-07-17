// src/infraestructure/dtos/update-dependant.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsDateString, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';

export class UpdateDependantDto {
  @ApiPropertyOptional({
    description: 'Novo primeiro nome do dependente.',
    example: 'Joana',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Novo último nome do dependente.',
    example: 'Souza',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Nova data de nascimento do dependente (AAAA-MM-DD).',
    example: '2011-03-15',
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({
    description: 'Nova relação de parentesco.',
    enum: DependantRelationship,
    example: DependantRelationship.DAUGHTER,
  })
  @IsOptional()
  @IsEnum(DependantRelationship)
  relationship?: DependantRelationship;

  @ApiPropertyOptional({
    description: 'Novo sexo do dependente.',
    enum: Sex,
    example: Sex.FEMALE,
  })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional({
    description: 'Novo email do dependente.',
    example: 'joana.souza@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Novo telefone do dependente.',
    example: '11912345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
