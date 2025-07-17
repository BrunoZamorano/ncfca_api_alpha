// src/infraestructure/dtos/add-dependant.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';

export class AddDependantDto {
  @ApiProperty({
    description: 'Primeiro nome do dependente.',
    example: 'João',
    minLength: 2,
  })
  @IsString({ message: 'First name must be a string.' })
  @MinLength(2, { message: 'First name must be at least 2 characters long.' })
  firstName: string;

  @ApiProperty({
    description: 'Último nome do dependente.',
    example: 'Silva',
    minLength: 2,
  })
  @IsString({ message: 'Last name must be a string.' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
  lastName: string;

  @ApiProperty({
    description: 'Data de nascimento do dependente no formato AAAA-MM-DD.',
    example: '2010-05-20',
  })
  @IsDateString({}, { message: 'Birth date must be a valid date string.' })
  birthdate: string;

  @ApiProperty({
    description: 'Relação de parentesco com o responsável familiar.',
    enum: DependantRelationship,
    example: DependantRelationship.SON,
  })
  @IsEnum(DependantRelationship, { message: 'Relationship must be a valid dependant relationship.' })
  relationship: DependantRelationship;

  @ApiProperty({
    description: 'Sexo do dependente.',
    enum: Sex,
    example: Sex.MALE,
  })
  @IsEnum(Sex, { message: 'Sex must be a valid sex value.' })
  sex: Sex;

  @ApiProperty({
    description: 'Email de contato do dependente (opcional).',
    example: 'joao.silva@example.com',
    required: false,
  })
  @IsString({ message: 'Email must be a string.' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Telefone de contato do dependente (opcional).',
    example: '11987654321',
    required: false,
  })
  @IsString({ message: 'Phone must be a string.' })
  @IsOptional()
  phone?: string;
}
