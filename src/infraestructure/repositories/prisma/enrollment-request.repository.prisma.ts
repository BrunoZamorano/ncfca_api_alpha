import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import EnrollmentRequestRepository from '@/domain/repositories/enrollment-request-repository';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import EnrollmentRequestMapper from '@/shared/mappers/enrollment-request.mapper';

@Injectable()
export class EnrollmentRequestRepositoryPrisma implements EnrollmentRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<EnrollmentRequest | null> {
    const request = await this.prisma.enrollmentRequest.findUnique({ where: { id } });
    return request ? EnrollmentRequestMapper.toDomain(request) : null;
  }

  async findByClubId(clubId: string): Promise<EnrollmentRequest[]> {
    const requests = await this.prisma.enrollmentRequest.findMany({ where: { club_id: clubId } });
    return requests.map(EnrollmentRequestMapper.toDomain);
  }

  async findByFamilyId(familyId: string): Promise<EnrollmentRequest[]> {
    const requests = await this.prisma.enrollmentRequest.findMany({ where: { family_id: familyId } });
    return requests.map(EnrollmentRequestMapper.toDomain);
  }

  async findByDependantAndClub(dependantId: string, clubId: string): Promise<EnrollmentRequest[]> {
    const requests = await this.prisma.enrollmentRequest.findMany({
      where: { member_id: dependantId, club_id: clubId },
    });
    return requests.map(EnrollmentRequestMapper.toDomain);
  }

  async findAll(): Promise<EnrollmentRequest[]> {
    const requests = await this.prisma.enrollmentRequest.findMany();
    return requests.map(EnrollmentRequestMapper.toDomain);
  }

  async save(request: EnrollmentRequest): Promise<EnrollmentRequest> {
    const requestData = EnrollmentRequestMapper.toPersistence(request);
    const savedRequest = await this.prisma.enrollmentRequest.upsert({
      where: { id: request.id },
      update: requestData,
      create: requestData,
    });
    return EnrollmentRequestMapper.toDomain(savedRequest);
  }
}
