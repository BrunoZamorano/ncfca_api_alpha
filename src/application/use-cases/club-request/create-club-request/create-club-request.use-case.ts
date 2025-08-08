import { ConflictException, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import ClubRequest from '@/domain/entities/club-request/club-request.entity';
import Address from '@/domain/value-objects/address/address';
import IdGenerator from '@/application/services/id-generator';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { CLUB_REPOSITORY, CLUB_REQUEST_REPOSITORY } from '@/shared/constants/repository-constants';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import ClubRepository from '@/domain/repositories/club-repository';
import { InvalidOperationException } from '@/domain/exceptions/domain-exception';

export interface CreateClubRequestInput {
  clubName: string;
  maxMembers?: number;
  requesterId: string;
  address: {
    city: string;
    state: string;
    number: string;
    street: string;
    zipCode: string;
    district: string;
    complement?: string;
  };
}

@Injectable()
export default class CreateClubRequestUseCase {
  constructor(
    @Inject(CLUB_REQUEST_REPOSITORY) private readonly clubRequestRepository: ClubRequestRepository,
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateClubRequestInput): Promise<ClubRequest> {
    const previousClub = await this.clubRepository.findByPrincipalId(input.requesterId);
    if (previousClub) throw new UnprocessableEntityException('Um usuário que já é dono de um clube não pode criar uma nova solicitação.');
    const hasPendingRequest = await this.clubRequestRepository.listPendingByRequesterId(input.requesterId);
    if (hasPendingRequest.length > 0) throw new ConflictException('O usuário já possui uma solicitação de clube pendente.');
    const clubRequest = new ClubRequest({
      id: this.idGenerator.generate(),
      status: ClubRequestStatus.PENDING,
      address: new Address(input.address),
      clubName: input.clubName,
      maxMembers: input.maxMembers,
      resolvedAt: null,
      requesterId: input.requesterId,
      requestedAt: new Date(),
      rejectionReason: null,
    });
    return await this.clubRequestRepository.save(clubRequest);
  }
}
