import { ApiProperty } from '@nestjs/swagger';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export class TournamentResponseDto {
  @ApiProperty({
    description: 'ID único do torneio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do torneio',
    example: 'Torneio Nacional de Debate Individual',
  })
  name: string;

  @ApiProperty({
    description: 'Descrição detalhada do torneio',
    example: 'Torneio nacional de debate para estudantes do ensino médio com foco em argumentação e oratória',
  })
  description: string;

  @ApiProperty({
    description: 'Tipo do torneio',
    enum: TournamentType,
    example: TournamentType.INDIVIDUAL,
  })
  type: TournamentType;

  @ApiProperty({
    description: 'Data de início das inscrições',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  registrationStartDate: Date;

  @ApiProperty({
    description: 'Data de fim das inscrições',
    type: String,
    format: 'date-time',
    example: '2024-01-15T23:59:59Z',
  })
  registrationEndDate: Date;

  @ApiProperty({
    description: 'Data de início do torneio',
    type: String,
    format: 'date-time',
    example: '2024-02-01T09:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Número de inscrições no torneio',
    example: 0,
  })
  registrationCount: number;

  @ApiProperty({
    description: 'Data de criação do torneio',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do torneio',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Data de deleção do torneio (soft delete)',
    type: String,
    format: 'date-time',
    example: null,
    nullable: true,
  })
  deletedAt?: Date | null;
}
