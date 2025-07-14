import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import FamilyRepository from '@/domain/repositories/family-repository';
import Family from '@/domain/entities/family/family';
import FamilyMapper from '@/shared/mappers/family.mapper';
import DependantMapper from '@/shared/mappers/dependant.mapper';

@Injectable()
export class FamilyRepositoryPrisma implements FamilyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<Family | null> {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: { dependants: true },
    });
    return family ? FamilyMapper.toDomain(family) : null;
  }

  async findByHolderId(holderId: string): Promise<Family | null> {
    const family = await this.prisma.family.findUnique({
      where: { holder_id: holderId },
      include: { dependants: true },
    });
    return family ? FamilyMapper.toDomain(family) : null;
  }

  async findAll(): Promise<Family[]> {
    const families = await this.prisma.family.findMany({ include: { dependants: true } });
    return families.map(FamilyMapper.toDomain);
  }

  async save(family: Family): Promise<Family> {
    const familyData = FamilyMapper.toPersistence(family);
    const savedFamilyData = await this.prisma.$transaction(async (prisma) => {
      await prisma.family.upsert({
        where: { id: family.id },
        update: familyData,
        create: familyData,
      });
      const existingDependants = await prisma.dependant.findMany({ where: { family_id: family.id } });
      const domainDependantIds = family.dependants.map((d) => d.id);
      const dependantsToDelete = existingDependants.filter((d) => !domainDependantIds.includes(d.id));
      if (dependantsToDelete.length > 0) {
        await prisma.dependant.deleteMany({ where: { id: { in: dependantsToDelete.map((d) => d.id) } } });
      }
      for (const dependant of family.dependants) {
        const dependantData = DependantMapper.toModel(dependant);
        await prisma.dependant.upsert({
          where: { id: dependant.id },
          update: dependantData,
          create: { ...dependantData, family_id: family.id },
        });
      }
      return prisma.family.findUniqueOrThrow({
        where: { id: family.id },
        include: { dependants: true },
      });
    });
    return FamilyMapper.toDomain(savedFamilyData);
  }
}
