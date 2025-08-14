import { Inject, Injectable } from '@nestjs/common';

import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import IdGenerator from '@/application/services/id-generator';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { AdminApproveEnrollmentCommand } from './approve-enrollment.command';

@Injectable()
export default class AdminApproveEnrollmentUseCase {
  public constructor(
    @Inject(UNIT_OF_WORK) private readonly _uow: UnitOfWork,
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
  ) {}

  async execute(command: AdminApproveEnrollmentCommand): Promise<void> {
    return await this._uow.executeInTransaction(async () => {
      // Verificar se a solicitação existe
      const request = await this._uow.enrollmentRequestRepository.findById(command.enrollmentId);
      if (!request) {
        throw new EntityNotFoundException('EnrollmentRequest', command.enrollmentId);
      }

      // Verificar se a solicitação está pendente
      if (request.status !== EnrollmentStatus.PENDING) {
        throw new InvalidOperationException('Cannot approve a request that is not pending.');
      }

      // Verificar se a solicitação pertence ao clube correto
      if (request.clubId !== command.clubId) {
        throw new InvalidOperationException('Enrollment request does not belong to the specified club.');
      }

      // Verificar se o clube existe
      const club = await this._uow.clubRepository.find(request.clubId);
      if (!club) {
        throw new EntityNotFoundException('Club', request.clubId);
      }

      // Verificar se a família está afiliada
      const family = await this._uow.familyRepository.find(request.familyId);
      if (!family || !family.isAffiliated()) {
        throw new InvalidOperationException('Cannot approve enrollment for a family that is not affiliated.');
      }

      // Verificar se o clube não atingiu a capacidade máxima
      if (club.isAtMaxCapacity()) {
        throw new InvalidOperationException('O clube já atingiu o número máximo de membros.');
      }

      // Aprovar matrícula
      club.addMember(request.dependantId, request.familyId, this._idGenerator);
      request.approve();

      // Persistir mudanças
      await this._uow.clubRepository.save(club);
      await this._uow.enrollmentRequestRepository.save(request);
    });
  }
}
