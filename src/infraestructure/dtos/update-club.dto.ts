// src/infraestructure/dtos/update-club.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Length, MinLength, ValidateNested } from 'class-validator';
import { AddressDto } from '@/domain/dtos/address.dto';
import { Type } from 'class-transformer';

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
    description: 'Número máximo de membros permitidos no clube. Deve ser um número inteiro. Ex: 100',
    example: '30',
  })
  @IsOptional()
  @IsNumber()
  maxMembers?: number;

  @ApiPropertyOptional({
    description: 'Endereço completo do responsável.',
    type: AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
