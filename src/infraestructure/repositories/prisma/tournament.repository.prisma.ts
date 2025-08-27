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
  constructor(private readonly prisma: PrismaService) {}

  async save(tournament: Tournament): Promise<void> {
    const tournamentData = TournamentMapper.entityToModel(tournament);

    try {
      await this.prisma.$transaction(async (prisma) => {
        // First, try to update the tournament with optimistic locking
        const result = await prisma.tournament.updateMany({
          where: {
            id: tournament.id,
            version: tournament.version - 1,
          },
          data: {
            ...tournamentData,
            updated_at: new Date(),
          },
        });

        if (result.count === 0) {
          // Check if tournament exists but with different version (optimistic lock failure)
          const existingTournament = await prisma.tournament.findFirst({
            where: { id: tournament.id, deleted_at: null },
          });

          if (existingTournament) {
            throw new OptimisticLockError('Tournament', tournament.id);
          }

          // Create new tournament if it doesn't exist
          await prisma.tournament.create({
            data: {
              ...tournamentData,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }

        // Now handle registrations - get existing ones and compare with current state
        const existingRegistrations = await prisma.registration.findMany({
          where: { tournament_id: tournament.id },
        });

        const currentRegistrations = tournament.registrations;
        const existingRegistrationIds = new Set(existingRegistrations.map(r => r.id));
        const currentRegistrationIds = new Set(currentRegistrations.map(r => r.id));

        // Create new registrations
        const newRegistrations = currentRegistrations.filter(r => !existingRegistrationIds.has(r.id));
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
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              // Unique constraint violation - competitor already registered
              throw new OptimisticLockError('Registration', `${registration.tournamentId}-${registration.competitorId}`);
            }
            throw error;
          }
        }

        // Update existing registrations
        const updatedRegistrations = currentRegistrations.filter(r => existingRegistrationIds.has(r.id));
        for (const registration of updatedRegistrations) {
          const registrationData = RegistrationMapper.entityToModel(registration);
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              ...registrationData,
              updated_at: registration.updatedAt,
            },
          });
        }

        // Delete removed registrations (if any)
        const removedRegistrationIds = [...existingRegistrationIds].filter(id => !currentRegistrationIds.has(id));
        if (removedRegistrationIds.length > 0) {
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
        registrations: true,
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
        registrations: true,
      },
    });

    if (!tournament) {
      return null;
    }

    return TournamentMapper.modelToEntity(tournament);
  }
}
