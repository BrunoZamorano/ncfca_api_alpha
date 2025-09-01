import { Inject } from '@nestjs/common';

import { PaginatedClubDto } from '@/domain/dtos/paginated-output.dto';
import { MembershipStatus } from '@/domain/enums/membership-status';
import SearchClubsQueryDto from '@/domain/dtos/search-clubs-query.dto';
import Address from '@/domain/value-objects/address/address';

import { ClubQuery, ClubMemberDto } from '@/application/queries/club-query/club.query';

import { PrismaService } from '@/infraestructure/database/prisma.service';

export class ClubQueryPrisma implements ClubQuery {
  private readonly select = {
    id: true,
    name: true,
    _count: { select: { memberships: { where: { status: MembershipStatus.ACTIVE } } } },
    created_at: true,
    updated_at: true,
    max_members: true,
    memberships: { where: { status: MembershipStatus.ACTIVE } },
    principal_id: true,
    city: true,
    state: true,
    number: true,
    street: true,
    zip_code: true,
    complement: true,
    neighborhood: true,
  };

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) { }

  async search(query: SearchClubsQueryDto): Promise<PaginatedClubDto> {
    const { page = 1, limit = 10 } = query?.pagination ?? {};
    const where = {
      name: { contains: query.filter?.name, mode: 'insensitive' as const },
      city: { contains: query.filter?.city, mode: 'insensitive' as const },
      state: { contains: query.filter?.state, mode: 'insensitive' as const },
    };
    const total = await this.prisma.club.count({ where });
    const clubsData = await this.prisma.club.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: this.select,
    });
    const clubDtos = clubsData.map((c) => ({
      id: c.id,
      name: c.name,
      address: new Address({
        city: c.city,
        state: c.state,
        number: c.number,
        street: c.street,
        zipCode: c.zip_code,
        district: c.neighborhood,
        complement: c.complement ?? undefined,
      }),
      maxMembers: c.max_members ?? undefined,
      corum: c._count.memberships,
      createdAt: c.created_at,
      principalId: c.principal_id,
    }));

    return {
      data: clubDtos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClubMembersListView(clubId: string): Promise<ClubMemberDto[]> {
    const result = await this.prisma.clubMembership.findMany({
      where: {
        club_id: clubId,
        status: 'ACTIVE',
      },
      include: {
        dependant: true,
        family: {
          include: {
            holder: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return result.map((membership) => ({
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
        cpf: membership.family.holder.cpf,
      },
    }));
  }
}
