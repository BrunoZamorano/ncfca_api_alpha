import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import IdGenerator from '@/application/services/id-generator';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { FamilyStatus } from '@/domain/enums/family-status';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { MembershipStatus } from '@/domain/enums/membership-status';

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
      if (!dependant) throw new ForbiddenException('O dependente não pertence à esta família.');
      const club = await this.uow.clubRepository.find(input.clubId);
      if (!club) throw new EntityNotFoundException('Club', input.clubId);
      if (family.status !== FamilyStatus.AFFILIATED) {
        throw new ForbiddenException('A família não está afiliada a um clube. Afilie-se primeiro.');
      }
      const existingRequests = await this.uow.enrollmentRequestRepository.findByDependantAndClub(dependant.id, club.id);
      const pendingRequests = existingRequests.filter((p) => p.status === EnrollmentStatus.PENDING);
      if (pendingRequests.length > 0) {
        throw new InvalidOperationException('Uma solicitação de matrícula pendente já existe para este dependente neste clube.');
      }
      const existingMembership = await this.uow.clubMembershipRepository.findByMemberAndClub(dependant.id, club.id);
      if (existingMembership && existingMembership.status === MembershipStatus.ACTIVE) {
        throw new InvalidOperationException('O Dependente já é membro ativo deste clube.');
      }
      if (club.isAtMaxCapacity()) {
        throw new InvalidOperationException('O clube já atingiu o número máximo de membros.');
      }
      const request = new EnrollmentRequest({
        dependantId: dependant.id,
        familyId: family.id,
        clubId: club.id,
        id: this.idGenerator.generate(),
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
