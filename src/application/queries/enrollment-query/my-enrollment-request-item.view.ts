import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

export class MyEnrollmentRequestItemView {
  @ApiProperty({
    description: 'Motivo da rejeição, caso o status seja REJECTED.',
    nullable: true,
    example: 'Vagas esgotadas para a faixa etária.',
  })
  rejectionReason: string | null;

  @ApiProperty({
    description: 'Data e hora em que a solicitação foi resolvida (aprovada/rejeitada).',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2025-07-20T15:30:00Z',
  })
  resolvedAt: Date | null;

  @ApiProperty({
    description: 'Data e hora em que a solicitação foi criada.',
    type: String,
    format: 'date-time',
    example: '2025-07-20T14:00:00Z',
  })
  requestedAt: Date;

  @ApiProperty({ description: 'Nome do dependente', example: 'Andrade Vieira' })
  dependantName: string;

  @ApiProperty({ description: 'Nome do clube', example: 'Clube de Debates' })
  clubName: string;

  @ApiProperty({
    description: 'Status atual da solicitação.',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.PENDING,
  })
  status: EnrollmentStatus;

  @ApiProperty({ description: 'ID único da requisição', format: 'uuid' })
  id: string;
}
