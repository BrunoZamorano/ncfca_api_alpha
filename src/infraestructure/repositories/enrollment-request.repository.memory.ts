import { Injectable } from '@nestjs/common';
import EnrollmentRequestRepository from '@/domain/repositories/enrollment-request-repository';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

@Injectable()
export default class EnrollmentRequestRepositoryMemory implements EnrollmentRequestRepository {
  private readonly db: InMemoryDatabase;
  constructor() {
    this.db = InMemoryDatabase.getInstance();
  }
  async save(request: EnrollmentRequest): Promise<EnrollmentRequest> {
    const index = this.db.enrollmentRequests.findIndex((r) => r.id === request.id);
    if (index === -1) {
      this.db.enrollmentRequests.push(request);
    } else {
      this.db.enrollmentRequests[index] = request;
    }
    return request;
  }
  async findById(id: string): Promise<EnrollmentRequest | null> {
    return this.db.enrollmentRequests.find((r) => r.id === id) ?? null;
  }
  async findByClubId(clubId: string): Promise<EnrollmentRequest[]> {
    return this.db.enrollmentRequests.filter((r) => r.clubId === clubId);
  }
  async findByFamilyId(familyId: string): Promise<EnrollmentRequest[]> {
    return this.db.enrollmentRequests.filter((r) => r.familyId === familyId);
  }
  async findByDependantAndClub(dependantId: string, clubId: string): Promise<EnrollmentRequest[]> {
    return this.db.enrollmentRequests.filter((p) => p.clubId === clubId && p.dependantId === dependantId) ?? [];
  }
  async findAll(): Promise<EnrollmentRequest[]> {
    return this.db.enrollmentRequests;
  }
}
