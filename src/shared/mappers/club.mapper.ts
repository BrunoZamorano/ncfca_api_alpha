import { Club as Model, ClubMembership as ClubMembershipModel } from '@prisma/client';

import Entity from '@/domain/entities/club/club';
import ClubDto from '@/domain/dtos/club.dto';
import Address from '@/domain/value-objects/address/address';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';

import ClubMembershipMapper from './club-membership.mapper';

type ClubWithMembersData = Model & { memberships?: ClubMembershipModel[] };

export default class ClubMapper {
  static modelToEntity(data: ClubWithMembersData): Entity {
    const members: ClubMembership[] = data.memberships ? data.memberships.map(ClubMembershipMapper.toEntity) : [];
    return new Entity({
      id: data.id,
      name: data.name,
      members: members,
      address: new Address({
        city: data.city,
        state: data.state,
        number: data.number,
        street: data.street,
        zipCode: data.zip_code,
        district: data.neighborhood,
        complement: data.complement ?? undefined,
      }),
      createdAt: data.created_at,
      maxMembers: data.max_members ?? undefined,
      principalId: data.principal_id,
    });
  }

  static entityToModel(entity: Entity): Omit<Model, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      name: entity.name,
      max_members: entity.maxMembers ?? null,
      principal_id: entity.principalId,
      city: entity.address.city,
      state: entity.address.state,
      number: entity.address.number,
      street: entity.address.street,
      zip_code: entity.address.zipCode,
      complement: entity.address.complement ?? null,
      neighborhood: entity.address.district,
    };
  }

  static entityToDto(entity: Entity): ClubDto {
    return {
      id: entity.id,
      name: entity.name,
      address: {
        city: entity.address.city,
        state: entity.address.state,
        street: entity.address.street,
        number: entity.address.number,
        zipCode: entity.address.zipCode,
        district: entity.address.district,
        complement: entity.address.complement ?? undefined,
      },
      corum: entity.members.length,
      createdAt: entity.createdAt,
      maxMembers: entity.maxMembers ?? undefined,
      principalId: entity.principalId,
    };
  }
}
