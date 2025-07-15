import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import IdGenerator from '@/application/services/id-generator';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { FamilyStatus } from '@/domain/enums/family-status';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

@Injectable()
export default class RequestEnrollment {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: RequestEnrollmentInput): Promise<EnrollmentRequest> {
    return await this.uow.executeInTransaction(async () => {
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
      const pendingRequests = existingRequests.filter((p) => p.status === EnrollmentStatus.PENDING);
      if (pendingRequests.length > 0) {
        throw new InvalidOperationException('A pending enrollment request for this dependant and club already exists.');
      }
      const existingMembership = await this.uow.clubMembershipRepository.findByMemberAndClub(dependant.id, club.id);
      if (existingMembership) {
        throw new InvalidOperationException('Dependant is already a member of this club.');
      }
      const request = new EnrollmentRequest({
        id: this.idGenerator.generate(),
        clubId: club.id,
        familyId: family.id,
        dependantId: dependant.id,
      });
      return await this.uow.enrollmentRequestRepository.save(request);
    });
  }
}

export interface RequestEnrollmentInput {
  loggedInUserId: string;
  dependantId: string;
  clubId: string;
}
