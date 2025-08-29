import { ApiProperty } from '@nestjs/swagger';

export class GetMyPendingRegistrationsListItemView {
  @ApiProperty({ description: 'ID único da inscrição', format: 'uuid' })
  registrationId: string;

  @ApiProperty({ description: 'Nome do torneio', example: 'Torneio Nacional 2024' })
  tournamentName: string;

  @ApiProperty({ description: 'Nome do dependente solicitante', example: 'João Silva' })
  competitorName: string;

  @ApiProperty({ description: 'ID do dependente solicitante', format: 'uuid' })
  competitorId: string;

  @ApiProperty({ description: 'Data da solicitação', example: '2024-01-15T10:30:00Z' })
  requestedAt: Date;

  @ApiProperty({ description: 'Tipo do torneio', example: 'DUO' })
  tournamentType: string;
}
