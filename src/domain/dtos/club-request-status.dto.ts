import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';

export class ClubRequestStatusDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  clubName: string;

  @ApiProperty({ enum: ClubRequestStatus })
  status: ClubRequestStatus;

  @ApiProperty()
  requestedAt: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date | null;

  @ApiPropertyOptional()
  rejectionReason?: string | null;
}
