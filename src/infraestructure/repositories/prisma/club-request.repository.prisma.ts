import ClubRepository from '@/domain/repositories/club-repository';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import ClubRequest from '@/domain/entities/club-request/club-request.entity';
import { Inject } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { ClubRequestMapper } from '@/shared/mappers/club-request.mapper';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';

export class ClubRequestRepositoryPrisma implements ClubRequestRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ClubRequest | null> {
    const model = await this.prisma.clubRequest.findUnique({ where: { id } });
    return model ? ClubRequestMapper.modelToEntity(model) : null;
  }

  async findByRequesterId(requesterId: string): Promise<ClubRequest[]> {
    const query = await this.prisma.clubRequest.findMany({ where: { requester_id: requesterId } });
    return query.map(ClubRequestMapper.modelToEntity);
  }

  async listPending(): Promise<ClubRequest[]> {
    const query = await this.prisma.clubRequest.findMany({ where: { status: ClubRequestStatus.PENDING } });
    return query.map(ClubRequestMapper.modelToEntity);
  }

  async save(request: ClubRequest): Promise<ClubRequest> {
    const model = await this.prisma.clubRequest.upsert({
      where: { id: request.id },
      update: ClubRequestMapper.entityToModel(request),
      create: ClubRequestMapper.entityToModel(request),
    });
    return ClubRequestMapper.modelToEntity(model);
  }
}
