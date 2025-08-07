// src/application/use-cases/club-request/list-pending-club-requests/list-pending-club-requests.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { ClubRequestStatusDto } from '@/domain/dtos/club-request-status.dto';
import ClubRequest from '@/domain/entities/club-request/club-request.entity';

@Injectable()
export default class ListPendingClubRequestsUseCase {
  constructor(@Inject(CLUB_REQUEST_REPOSITORY) private readonly clubRequestRepository: ClubRequestRepository) {}

  async execute(): Promise<ClubRequestStatusDto[]> {
    const pendingRequests = await this.clubRequestRepository.listPending();
    return pendingRequests.map(this.mapToDto);
  }

  private mapToDto(entity: ClubRequest): ClubRequestStatusDto {
    return {
      id: entity.id,
      clubName: entity.clubName,
      status: entity.status,
      requestedAt: entity.requestedAt,
      resolvedAt: entity.resolvedAt,
      rejectionReason: entity.rejectionReason,
    };
  }
}
