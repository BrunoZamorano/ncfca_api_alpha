// src/domain/dtos/club.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, Min, ValidateNested } from 'class-validator';
import { AddressDto } from '@/domain/dtos/address.dto';
import { Type } from 'class-transformer';

export default class ClubDto {
  @ApiProperty({
    description: 'ID único do clube.',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Nome oficial do clube.',
    example: 'Clube de Debate Oradores do Amanhã',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Número máximo de membros para o clube.',
    example: 50,
    minimum: 2,
  })
  @IsOptional()
  @IsNotEmpty()
  @Min(2)
  maxMembers?: number;

  @ApiProperty({
    description: 'Endereço de localização do clube.',
    type: AddressDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    description: 'ID do usuário que é o diretor do clube (principal).',
    format: 'uuid',
    example: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  principalId: string;

  @ApiProperty({
    description: 'Data de criação do clube.',
    type: 'string',
    format: 'date-time',
    example: '2023-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Quantidade de membros ativos no clube.',
    example: 25,
  })
  corum: number;
}
