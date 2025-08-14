import { Inject } from '@nestjs/common';

import { ClubQuery, ClubMemberDto } from '@/application/queries/club-query/club.query';

import { PrismaService } from '@/infraestructure/database/prisma.service';

export class ClubQueryPrisma implements ClubQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getClubMembersListView(clubId: string): Promise<ClubMemberDto[]> {
    const result = await this.prisma.clubMembership.findMany({
      where: {
        club_id: clubId,
        status: 'ACTIVE'
      },
      include: {
        dependant: true,
        family: {
          include: {
            holder: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return result.map(membership => ({
      id: membership.id,
      dependantId: membership.dependant.id,
      dependantName: `${membership.dependant.first_name} ${membership.dependant.last_name}`,
      dependantAge: new Date().getFullYear() - new Date(membership.dependant.birthdate).getFullYear(),
      dependantType: membership.dependant.type,
      dependantSex: membership.dependant.sex,
      dependantEmail: membership.dependant.email,
      dependantPhone: membership.dependant.phone,
      dependantBirthDate: membership.dependant.birthdate.toISOString(),
      joinedAt: membership.created_at.toISOString(),
      status: membership.status,
      holder: {
        id: membership.family.holder.id,
        firstName: membership.family.holder.first_name,
        lastName: membership.family.holder.last_name,
        email: membership.family.holder.email,
        phone: membership.family.holder.phone,
        cpf: membership.family.holder.cpf
      }
    }));
  }
}