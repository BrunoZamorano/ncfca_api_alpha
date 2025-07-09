import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import IdGenerator from '@/application/services/id-generator';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { FamilyStatus } from '@/domain/enums/family-status';

@Injectable()
export default class RequestEnrollmentUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: RequestEnrollmentInput): Promise<EnrollmentRequest> {
    await this.uow.beginTransaction();
    try {
      const family = await this.uow.familyRepository.findByHolderId(input.loggedInUserId);
      if (!family) throw new EntityNotFoundException('Family', `for user ${input.loggedInUserId}`);
      const dependant = family.dependants.find((d) => d.id === input.dependantId);
      if (!dependant) throw new ForbiddenException('Dependant does not belong to this family.');
      const club = await this.uow.clubRepository.find(input.clubId);
      if (!club) throw new EntityNotFoundException('Club', input.clubId);
      if (family.status !== FamilyStatus.AFFILIATED) {
        throw new ForbiddenException('Family must be affiliated to request enrollment.');
      }
      const existingRequests = await this.uow.enrollmentRequestRepository.findByDependantAndClub(dependant.id, club.id);
      if (existingRequests.length > 0) {
        throw new InvalidOperationException('An enrollment request for this dependant and club already exists.');
      }
      const request = new EnrollmentRequest({
        id: this.idGenerator.generate(),
        clubId: club.id,
        familyId: family.id,
        dependantId: dependant.id,
      });
      const savedRequest = await this.uow.enrollmentRequestRepository.save(request);
      await this.uow.commit();
      return savedRequest;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}

export interface RequestEnrollmentInput {
  loggedInUserId: string;
  dependantId: string;
  clubId: string;
}
