import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import { IsNotEmpty, IsObject, IsOptional, Min, ValidateNested } from 'class-validator';
import { AddressDto } from '@/domain/dtos/address.dto';
import { Type } from 'class-transformer';

/**
 * DTO para representar o status de uma solicitação de criação de clube.
 * Contém informações sobre a solicitação, incluindo dados do clube,
 * status atual, endereço e informações de auditoria.
 */
export class ClubRequestStatusDto {
  @ApiProperty({ 
    description: 'ID único da solicitação de criação do clube.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário que fez a solicitação de criação do clube.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  requesterId: string;

  @ApiProperty({
    description: 'Nome do clube solicitado.',
    example: 'Clube de Oratória Brasília'
  })
  clubName: string;

  @ApiProperty({ 
    description: 'Status atual da solicitação de criação do clube.',
    enum: ClubRequestStatus,
    example: ClubRequestStatus.PENDING
  })
  status: ClubRequestStatus;

  @ApiProperty({
    description: 'Número máximo de membros permitidos no clube.',
    example: 50,
    minimum: 1,
  })
  @IsOptional()
  @IsNotEmpty()
  @Min(1)
  maxMembers?: number;

  @ApiProperty({
    description: 'Endereço onde o clube será localizado.',
    type: AddressDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    description: 'Data e hora em que a solicitação foi criada.',
    type: Date,
    example: '2024-01-15T10:30:00Z'
  })
  requestedAt: Date;

  @ApiPropertyOptional({
    description: 'Data e hora em que a solicitação foi resolvida (aprovada ou rejeitada).',
    type: Date,
    example: '2024-01-20T14:45:00Z'
  })
  resolvedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Motivo da rejeição da solicitação, se aplicável.',
    example: 'Documentação incompleta'
  })
  rejectionReason?: string | null;
}
