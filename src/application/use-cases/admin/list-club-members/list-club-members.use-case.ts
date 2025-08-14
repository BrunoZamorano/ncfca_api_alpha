import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { MembershipStatus } from '@/domain/enums/membership-status';
import { ListClubMembersQuery } from './list-club-members.query';

export interface ClubMemberView {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship: string;
  type: string;
  sex: string;
  birthdate: Date;
  joinedAt: Date;
  status: MembershipStatus;
}

@Injectable()
export default class AdminListClubMembersUseCase {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(query: ListClubMembersQuery): Promise<{
    members: ClubMemberView[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Verificar se o clube existe
    const club = await this.uow.clubRepository.find(query.clubId);
    if (!club) {
      throw new EntityNotFoundException('Club', query.clubId);
    }

    // Buscar membros ativos do clube
    const memberships = await this.uow.clubMembershipRepository.findByClub(query.clubId);
    const activeMembers = memberships.filter((m) => m.status === MembershipStatus.ACTIVE);

    // Buscar informações dos dependentes
    const memberIds = activeMembers.map((m) => m.memberId);
    const dependants = await Promise.all(
      memberIds.map((id) => this.uow.familyRepository.findDependant(id))
    );

    // Mapear para a view
    const members: ClubMemberView[] = [];
    for (let i = 0; i < activeMembers.length; i++) {
      const membership = activeMembers[i];
      const dependant = dependants[i];
      
      if (dependant) {
        members.push({
          id: dependant.id,
          firstName: dependant.firstName,
          lastName: dependant.lastName,
          email: dependant.email,
          phone: dependant.phone,
          relationship: dependant.relationship,
          type: dependant.type,
          sex: dependant.sex,
          birthdate: dependant.birthdate,
          joinedAt: membership.createdAt,
          status: membership.status,
        });
      }
    }

    // Aplicar paginação
    const offset = (query.page - 1) * query.limit;
    const paginatedMembers = members.slice(offset, offset + query.limit);

    return {
      members: paginatedMembers,
      total: members.length,
      page: query.page,
      limit: query.limit,
    };
  }
}