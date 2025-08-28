import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TournamentDetailsView {
  @ApiProperty({
    description: 'ID único do torneio',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do torneio',
    example: 'Torneio Nacional de Debate Individual',
  })
  name: string;

  @ApiProperty({
    description: 'Tipo do torneio',
    example: 'INDIVIDUAL',
    enum: ['INDIVIDUAL', 'DUO'],
  })
  type: string;

  @ApiProperty({
    description: 'Data de criação do torneio',
    type: String,
    format: 'date-time',
    example: '2023-12-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de início do torneio',
    type: String,
    format: 'date-time',
    example: '2024-02-01T09:00:00Z',
  })
  startDate: Date;

  @ApiPropertyOptional({
    description: 'Data de exclusão do torneio (soft delete)',
    type: String,
    format: 'date-time',
    example: '2024-01-30T12:00:00Z',
    nullable: true,
  })
  deletedAt?: Date;

  @ApiProperty({
    description: 'Descrição detalhada do torneio',
    example: 'Torneio nacional de debate para estudantes do ensino médio com foco em argumentação e oratória',
  })
  description: string;

  @ApiProperty({
    description: 'Número de inscrições no torneio',
    example: 25,
  })
  registrationCount: number;

  @ApiProperty({
    description: 'Data de fim das inscrições',
    type: String,
    format: 'date-time',
    example: '2024-01-15T23:59:59Z',
  })
  registrationEndDate: Date;

  @ApiProperty({
    description: 'Data de início das inscrições',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  registrationStartDate: Date;
}
