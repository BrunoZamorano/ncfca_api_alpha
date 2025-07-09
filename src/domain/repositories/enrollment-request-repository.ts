import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';

export default interface EnrollmentRequestRepository {
  save(request: EnrollmentRequest): Promise<EnrollmentRequest>;
  findById(id: string): Promise<EnrollmentRequest | null>;
  findByClubId(clubId: string): Promise<EnrollmentRequest[]>;
  findByFamilyId(familyId: string): Promise<EnrollmentRequest[]>;
}

export const ENROLLMENT_REQUEST_REPOSITORY = Symbol('ENROLLMENT_REQUEST_REPOSITORY');
