import { Inject, Injectable } from '@nestjs/common';
import EnrollmentRequestRepository from '@/domain/repositories/enrollment-request-repository';
import { ENROLLMENT_REQUEST_REPOSITORY } from '@/domain/repositories/enrollment-request-repository';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';

@Injectable()
export default class AdminListAllEnrollments {
  constructor(
    @Inject(ENROLLMENT_REQUEST_REPOSITORY)
    private readonly enrollmentRequestRepository: EnrollmentRequestRepository,
  ) {}
  async execute(): Promise<EnrollmentRequest[]> {
    return this.enrollmentRequestRepository.findAll();
  }
}
