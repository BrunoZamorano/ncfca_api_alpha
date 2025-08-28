import { PrismaService } from '@/infraestructure/database/prisma.service';

/**
 * Utility para cleanup cirúrgico dos dados de teste
 * Remove apenas os dados relacionados aos userIds e tournamentIds fornecidos,
 * respeitando a ordem correta devido às foreign keys
 */
export async function surgicalCleanup(prisma: PrismaService, userIds: string[], tournamentIds: string[] = []): Promise<void> {
  if (userIds.length === 0 && tournamentIds.length === 0) {
    return;
  }
  await prisma.$transaction(async (tx) => {
    if (userIds.length > 0) {
      await tx.clubMembership.deleteMany({
        where: {
          OR: [{ club: { principal_id: { in: userIds } } }, { family: { holder_id: { in: userIds } } }],
        },
      });
      await tx.enrollmentRequest.deleteMany({
        where: {
          OR: [{ club: { principal_id: { in: userIds } } }, { family: { holder_id: { in: userIds } } }],
        },
      });
      await tx.club.deleteMany({
        where: { principal_id: { in: userIds } },
      });
      await tx.clubRequest.deleteMany({
        where: { requester_id: { in: userIds } },
      });
    }
    // Delete RegistrationSync first (references registration)
    const registrationSyncConditions: any[] = [];
    if (userIds.length > 0) {
      registrationSyncConditions.push({
        registration: { competitor: { family: { holder_id: { in: userIds } } } },
      });
    }
    if (tournamentIds.length > 0) {
      registrationSyncConditions.push({
        registration: { tournament_id: { in: tournamentIds } },
      });
    }

    if (registrationSyncConditions.length > 0) {
      await tx.registrationSync.deleteMany({
        where: { OR: registrationSyncConditions },
      });
    }

    // Then delete registrations (references competitor/dependant and tournament)
    const registrationConditions: any[] = [];
    if (userIds.length > 0) {
      registrationConditions.push({
        competitor: { family: { holder_id: { in: userIds } } },
      });
    }
    if (tournamentIds.length > 0) {
      registrationConditions.push({
        tournament_id: { in: tournamentIds },
      });
    }

    if (registrationConditions.length > 0) {
      await tx.registration.deleteMany({
        where: { OR: registrationConditions },
      });
    }
    if (userIds.length > 0) {
      await tx.dependant.deleteMany({
        where: { family: { holder_id: { in: userIds } } },
      });
      await tx.transaction.deleteMany({
        where: { user_id: { in: userIds } },
      });
    }
    if (userIds.length > 0) {
      await tx.family.deleteMany({
        where: { holder_id: { in: userIds } },
      });
    }
    if (userIds.length > 0) {
      await tx.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    // Clean up specific tournaments last (after all references are removed)
    if (tournamentIds.length > 0) {
      await tx.tournament.deleteMany({
        where: { id: { in: tournamentIds } },
      });
    }
  });
}
