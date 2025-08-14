import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { ListPendingEnrollmentsQuery } from './list-pending-enrollments.query';

export interface PendingEnrollmentView {
  id: string;
  dependantId: string;
  dependantName: string;
  dependantEmail?: string;
  dependantPhone?: string;
  familyId: string;
  requestedAt: Date;
  status: EnrollmentStatus;
}

@Injectable()
export default class AdminListPendingEnrollmentsUseCase {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(query: ListPendingEnrollmentsQuery): Promise<PendingEnrollmentView[]> {
    // Verificar se o clube existe
    const club = await this.uow.clubRepository.find(query.clubId);
    if (!club) {
      throw new EntityNotFoundException('Club', query.clubId);
    }

    // Buscar solicitações pendentes do clube
    const enrollmentRequests = await this.uow.enrollmentRequestRepository.findByClubId(query.clubId);
    const pendingRequests = enrollmentRequests.filter((req) => req.status === EnrollmentStatus.PENDING);

    // Buscar informações dos dependentes
    const dependantIds = pendingRequests.map((req) => req.dependantId);
    const dependants = await Promise.all(dependantIds.map((id) => this.uow.familyRepository.findDependant(id)));

    // Mapear para a view
    const pendingEnrollments: PendingEnrollmentView[] = [];
    for (let i = 0; i < pendingRequests.length; i++) {
      const request = pendingRequests[i];
      const dependant = dependants[i];

      if (dependant) {
        pendingEnrollments.push({
          id: request.id,
          dependantId: dependant.id,
          dependantName: `${dependant.firstName} ${dependant.lastName}`,
          dependantEmail: dependant.email,
          dependantPhone: dependant.phone,
          familyId: request.familyId,
          requestedAt: request.requestedAt,
          status: request.status,
        });
      }
    }

    return pendingEnrollments;
  }
}
