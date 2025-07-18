import { Club as ClubData, ClubMembership as ClubMembershipData } from '@prisma/client';
import Club from '@/domain/entities/club/club';
import ClubDto from '@/domain/dtos/club.dto';
import ClubMembershipMapper from './club-membership.mapper';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';

type ClubWithMembersData = ClubData & { members?: ClubMembershipData[] };

export default class ClubMapper {
  static modelToEntity(data: ClubWithMembersData): Club {
    const members: ClubMembership[] = data.members ? data.members.map(ClubMembershipMapper.toEntity) : [];
    return new Club({
      id: data.id,
      name: data.name,
      city: data.city,
      state: data.state,
      principalId: data.principal_id,
      members: members,
    });
  }

  static entityToModel(entity: Club): Omit<ClubData, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      name: entity.name,
      city: entity.city,
      state: entity.state,
      principal_id: entity.principalId,
    };
  }

  static entityToDto(entity: Club): ClubDto {
    return {
      id: entity.id,
      name: entity.name,
      city: entity.city,
      state: entity.state,
      principalId: entity.principalId,
    };
  }
}
