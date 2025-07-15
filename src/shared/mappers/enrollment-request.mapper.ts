import { EnrollmentRequest as EnrollmentRequestData } from '@prisma/client';

import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

export default class EnrollmentRequestMapper {
  static toDomain(data: EnrollmentRequestData): EnrollmentRequest {
    return new EnrollmentRequest({
      rejectionReason: data.rejection_reason,
      dependantId: data.member_id,
      requestedAt: data.requested_at,
      resolvedAt: data.resolved_at,
      familyId: data.family_id,
      clubId: data.club_id,
      status: data.status as EnrollmentStatus,
      id: data.id,
    });
  }

  static toPersistence(entity: EnrollmentRequest): EnrollmentRequestData {
    return {
      id: entity.id,
      status: entity.status,
      club_id: entity.clubId,
      family_id: entity.familyId,
      resolved_at: entity.resolvedAt,
      requested_at: entity.requestedAt,
      member_id: entity.dependantId,
      rejection_reason: entity.rejectionReason,
    };
  }
}
