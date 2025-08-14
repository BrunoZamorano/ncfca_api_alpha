// src/application/use-cases/club-request/get-user-club-requests/get-user-club-requests.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { ClubRequestStatusDto } from '@/domain/dtos/club-request-status.dto';
import ClubRequest from '@/domain/entities/club-request/club-request.entity';
import { ClubRequestMapper } from '@/shared/mappers/club-request.mapper';

@Injectable()
export default class GetUserClubRequestsUseCase {
  constructor(@Inject(CLUB_REQUEST_REPOSITORY) private readonly clubRequestRepository: ClubRequestRepository) {}

  async execute(requesterId: string): Promise<ClubRequestStatusDto[]> {
    const userRequests = await this.clubRequestRepository.findByRequesterId(requesterId);
    return userRequests.map(ClubRequestMapper.entityToDto);
  }
}
