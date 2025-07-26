// src/domain/dtos/family.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import DependantDto from './dependant.dto';
import { FamilyStatus } from '../enums/family-status';
import { HolderDto } from '@/domain/dtos/holder.dto';
import { UserDto } from '@/domain/dtos/user.dto';

export class AffiliationDto {
  @ApiProperty({
    description: 'ID único da família.',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Dados do titular.',
    type: () => UserDto,
  })
  holder: UserDto;

  @ApiProperty({
    description: 'Status atual da afiliação da família.',
    enum: FamilyStatus,
    example: FamilyStatus.AFFILIATED,
  })
  status: string;

  @ApiProperty({
    description: 'Data em que a afiliação se tornou ativa.',
    type: 'string',
    format: 'date-time',
    example: '2025-07-17T03:00:00.000Z',
    nullable: true,
  })
  affiliatedAt: Date | null;

  @ApiProperty({
    description: 'Data em que a afiliação irá expirar.',
    type: 'string',
    format: 'date-time',
    example: '2026-07-17T03:00:00.000Z',
    nullable: true,
  })
  affiliationExpiresAt: Date | null;

  @ApiProperty({
    description: 'Lista de dependentes associados a esta família.',
    type: () => [DependantDto],
  })
  dependants: DependantDto[];
}
