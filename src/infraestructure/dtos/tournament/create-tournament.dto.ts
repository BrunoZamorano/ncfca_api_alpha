import { IsString, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

export class CreateTournamentDto {
  @ApiProperty({
    description: 'Nome do torneio',
    example: 'Torneio Nacional de Debate Individual',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descrição detalhada do torneio',
    example: 'Torneio nacional de debate para estudantes do ensino médio com foco em argumentação e oratória',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Tipo do torneio',
    enum: TournamentType,
    example: TournamentType.INDIVIDUAL,
  })
  @IsEnum(TournamentType)
  type: TournamentType;

  @ApiProperty({
    description: 'Data de início das inscrições',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  registrationStartDate: Date;

  @ApiProperty({
    description: 'Data de fim das inscrições',
    type: String,
    format: 'date-time',
    example: '2024-01-15T23:59:59Z',
  })
  @IsDateString()
  registrationEndDate: Date;

  @ApiProperty({
    description: 'Data de início do torneio',
    type: String,
    format: 'date-time',
    example: '2024-02-01T09:00:00Z',
  })
  @IsDateString()
  startDate: Date;
}