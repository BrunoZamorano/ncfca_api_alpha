import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import Tournament from '@/domain/entities/tournament/tournament.entity';
import TournamentMapper from '@/shared/mappers/tournament.mapper';
import RegistrationMapper from '@/shared/mappers/registration.mapper';
import { OptimisticLockError } from '@/domain/exceptions/domain-exception';

import { PrismaService } from '@/infraestructure/database/prisma.service';

@Injectable()
export class PrismaTournamentRepository implements TournamentRepository {
  constructor(private readonly prisma: PrismaService) { }

  async save(tournament: Tournament): Promise<void> {
    const tournamentData = TournamentMapper.entityToModel(tournament);
    try {
      await this.prisma.$transaction(async (prisma) => {
        // First, try to update the tournament with optimistic locking
        const result = await prisma.tournament.updateMany({
          where: { id: tournament.id, version: tournament.version - 1, },
          data: { ...tournamentData, updated_at: new Date(), },
        });
        if (result.count === 0) {
          const existingTournament = await prisma.tournament.findUnique({
            where: { id: tournament.id, deleted_at: null },
          });
          if (existingTournament) throw new OptimisticLockError('Tournament', tournament.id);
          await prisma.tournament.create({ data: { ...tournamentData, created_at: new Date(), updated_at: new Date(), }, });
        }
        const existingRegistrations = await prisma.registration.findMany({ where: { tournament_id: tournament.id }, });
        const currentRegistrations = tournament.registrations;
        const existingRegistrationIds = new Set(existingRegistrations.map((r) => r.id));
        const currentRegistrationIds = new Set(currentRegistrations.map((r) => r.id));

        // Create new registrations and their sync records
        const newRegistrations = currentRegistrations.filter((r) => !existingRegistrationIds.has(r.id));
        for (const registration of newRegistrations) {
          const registrationData = RegistrationMapper.entityToModel(registration);
          try {
            await prisma.registration.create({
              data: {
                ...registrationData,
                created_at: registration.createdAt,
                updated_at: registration.updatedAt,
              },
            });
            // Create the associated RegistrationSync
            await prisma.registrationSync.create({
              data: {
                id: registration.sync.id,
                registration_id: registration.id,
                status: registration.sync.status,
                created_at: registration.sync.createdAt,
                updated_at: registration.sync.updatedAt,
              },
            });
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              // Unique constraint violation - competitor already registered
              throw new OptimisticLockError('Registration', `${registration.tournamentId}-${registration.competitorId}`);
            }
            throw error;
          }
        }

        // Update existing registrations and their sync records
        const updatedRegistrations = currentRegistrations.filter((r) => existingRegistrationIds.has(r.id));
        for (const registration of updatedRegistrations) {
          const registrationData = RegistrationMapper.entityToModel(registration);
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              ...registrationData,
              updated_at: registration.updatedAt,
            },
          });

          // Update the associated RegistrationSync
          await prisma.registrationSync.upsert({
            where: { registration_id: registration.id },
            create: {
              id: registration.sync.id,
              registration_id: registration.id,
              status: registration.sync.status,

              created_at: registration.sync.createdAt,
              updated_at: registration.sync.updatedAt,
            },
            update: {
              status: registration.sync.status,
              updated_at: registration.sync.updatedAt,
            },
          });
        }

        // Delete removed registrations and their sync records (if any)
        const removedRegistrationIds = [...existingRegistrationIds].filter((id) => !currentRegistrationIds.has(id));
        if (removedRegistrationIds.length > 0) {
          // Delete RegistrationSync records first (foreign key constraint)
          await prisma.registrationSync.deleteMany({
            where: { registration_id: { in: removedRegistrationIds } },
          });
          await prisma.registration.deleteMany({
            where: { id: { in: removedRegistrationIds } },
          });
        }
      });
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new OptimisticLockError('Registration', 'duplicate-registration');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Tournament | null> {
    const tournament = await this.prisma.tournament.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        registrations: {
          include: {
            sync: true,
          },
        },
      },
    });

    if (!tournament) {
      return null;
    }

    return TournamentMapper.modelToEntity(tournament);
  }

  async findByRegistrationId(registrationId: string): Promise<Tournament | null> {
    const tournament = await this.prisma.tournament.findFirst({
      where: {
        deleted_at: null,
        registrations: {
          some: {
            id: registrationId,
          },
        },
      },
      include: {
        registrations: {
          include: {
            sync: true,
          },
        },
      },
    });

    if (!tournament) {
      return null;
    }

    return TournamentMapper.modelToEntity(tournament);
  }
}
