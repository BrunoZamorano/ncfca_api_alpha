import { Inject, Injectable } from '@nestjs/common';

import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { AdminRejectEnrollmentCommand } from './reject-enrollment.command';

@Injectable()
export default class AdminRejectEnrollmentUseCase {
  public constructor(@Inject(UNIT_OF_WORK) private readonly _uow: UnitOfWork) {}

  async execute(command: AdminRejectEnrollmentCommand): Promise<void> {
    return await this._uow.executeInTransaction(async () => {
      // Verificar se a solicitação existe
      const request = await this._uow.enrollmentRequestRepository.findById(command.enrollmentId);
      if (!request) {
        throw new EntityNotFoundException('EnrollmentRequest', command.enrollmentId);
      }

      // Verificar se a solicitação está pendente
      if (request.status !== EnrollmentStatus.PENDING) {
        throw new InvalidOperationException('Cannot reject a request that is not pending.');
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

      // Rejeitar solicitação
      const rejectionReason = command.rejectionReason || 'Solicitação rejeitada pelo administrador';
      request.reject(rejectionReason);

      // Persistir mudanças
      await this._uow.enrollmentRequestRepository.save(request);
    });
  }
}
