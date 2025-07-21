
import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

export class ListPendingEnrollmentsOutputDto {
  @ApiProperty({
    description: 'ID único da solicitação de matrícula.',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  id: string;

  @ApiProperty({
    description: 'Status atual da solicitação.',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.PENDING,
  })
  status: EnrollmentStatus;

  @ApiProperty({
    description: 'ID do clube ao qual a matrícula foi solicitada.',
    format: 'uuid',
    example: 'c1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p7',
  })
  clubId: string;

  @ApiProperty({
    description: 'ID da família que está solicitando a matrícula.',
    format: 'uuid',
    example: 'd1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p8',
  })
  familyId: string;

  @ApiProperty({
    description: 'ID do dependente para o qual a matrícula se aplica.',
    format: 'uuid',
    example: 'e1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p9',
  })
  dependantId: string;

  @ApiProperty({
    description: 'Nome do dependente para o qual a matrícula se aplica.',
    example: 'Augustus Nicodemus',
  })
  dependantName: string;

  @ApiProperty({
    description: 'Data e hora em que a solicitação foi criada.',
    type: String,
    format: 'date-time',
    example: '2025-07-20T14:00:00Z',
  })
  requestedAt: Date;

  @ApiProperty({
    description: 'Data e hora em que a solicitação foi resolvida (aprovada/rejeitada).',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2025-07-20T15:30:00Z',
  })
  resolvedAt: Date | null;

  @ApiProperty({
    description: 'Motivo da rejeição, caso o status seja REJECTED.',
    nullable: true,
    example: 'Vagas esgotadas para a faixa etária.',
  })
  rejectionReason: string | null;
}
