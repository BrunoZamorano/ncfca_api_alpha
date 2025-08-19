import { PrismaService } from '@/infraestructure/database/prisma.service';

/**
 * Utility para cleanup cirúrgico dos dados de teste
 * Remove apenas os dados relacionados aos userIds fornecidos,
 * respeitando a ordem correta devido às foreign keys
 */
export async function surgicalCleanup(prisma: PrismaService, userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.clubMembership.deleteMany({
      where: {
        OR: [
          { club: { principal_id: { in: userIds } } },
          { family: { holder_id: { in: userIds } } },
        ],
      },
    });
    await tx.enrollmentRequest.deleteMany({
      where: {
        OR: [
          { club: { principal_id: { in: userIds } } },
          { family: { holder_id: { in: userIds } } },
        ],
      },
    });
    await tx.club.deleteMany({
      where: { principal_id: { in: userIds } },
    });
    await tx.clubRequest.deleteMany({
      where: { requester_id: { in: userIds } },
    });
    await tx.dependant.deleteMany({
      where: { family: { holder_id: { in: userIds } } },
    });
    await tx.transaction.deleteMany({
      where: { user_id: { in: userIds } },
    });
    await tx.family.deleteMany({
      where: { holder_id: { in: userIds } },
    });
    await tx.user.deleteMany({
      where: { id: { in: userIds } },
    });
  });
}