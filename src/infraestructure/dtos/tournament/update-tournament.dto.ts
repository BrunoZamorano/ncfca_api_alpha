import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export class UpdateTournamentDto {
  @ApiPropertyOptional({
    description: 'Nome do torneio',
    example: 'Torneio Nacional de Debate Individual',
    minLength: 3,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do torneio',
    example: 'Torneio nacional de debate para estudantes do ensino médio com foco em argumentação e oratória',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tipo do torneio',
    enum: TournamentType,
    example: TournamentType.INDIVIDUAL,
  })
  @IsEnum(TournamentType)
  @IsOptional()
  type?: TournamentType;

  @ApiPropertyOptional({
    description: 'Data de início das inscrições',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  registrationStartDate?: Date;

  @ApiPropertyOptional({
    description: 'Data de fim das inscrições',
    type: String,
    format: 'date-time',
    example: '2024-01-15T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  registrationEndDate?: Date;

  @ApiPropertyOptional({
    description: 'Data de início do torneio',
    type: String,
    format: 'date-time',
    example: '2024-02-01T09:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: Date;
}