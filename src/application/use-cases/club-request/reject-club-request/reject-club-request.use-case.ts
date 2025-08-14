import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import { DomainException } from '@/domain/exceptions/domain-exception';
import { CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';

export interface RejectClubRequestInput {
  clubRequestId: string;
  reason: string;
}

@Injectable()
export default class RejectClubRequestUseCase {
  constructor(@Inject(CLUB_REQUEST_REPOSITORY) private readonly clubRequestRepository: ClubRequestRepository) {}

  async execute(input: RejectClubRequestInput): Promise<void> {
    const clubRequest = await this.clubRequestRepository.findById(input.clubRequestId);
    if (!clubRequest) throw new NotFoundException('Solicitação de clube não encontrada');
    clubRequest.reject(input.reason);
    await this.clubRequestRepository.save(clubRequest);
    // TODO: Disparar evento ClubRequestRejected quando necessário
  }
}
