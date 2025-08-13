import { ClubRequest as Model } from '@prisma/client';

import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import Address from '@/domain/value-objects/address/address';
import Entity from '@/domain/entities/club-request/club-request.entity';
import { ClubRequestStatusDto as Dto } from '@/domain/dtos/club-request-status.dto';

export class ClubRequestMapper {
  static modelToEntity(model: Model): Entity {
    return new Entity({
      id: model.id,
      status: model.status as ClubRequestStatus,
      clubName: model.club_name,
      maxMembers: model.max_members ?? undefined,
      resolvedAt: model.resolved_at,
      requesterId: model.requester_id,
      requestedAt: model.requested_at,
      rejectionReason: model.rejection_reason ?? undefined,
      address: new Address({
        city: model.city,
        state: model.state,
        number: model.number,
        street: model.street,
        zipCode: model.zip_code,
        district: model.neighborhood,
        complement: model.complement ?? undefined,
      }),
    });
  }

  static entityToModel(entity: Entity): Model {
    return {
      id: entity.id,
      status: entity.status,
      club_name: entity.clubName,
      max_members: entity.maxMembers ?? null,
      resolved_at: entity.resolvedAt,
      requester_id: entity.requesterId,
      requested_at: entity.requestedAt,
      rejection_reason: entity.rejectionReason ?? null,
      city: entity.address.city,
      state: entity.address.state,
      number: entity.address.number,
      street: entity.address.street,
      zip_code: entity.address.zipCode,
      complement: entity.address.complement ?? null,
      neighborhood: entity.address.district,
    };
  }

  static entityToDto(entity: Entity): Dto {
    return {
      id: entity.id,
      status: entity.status,
      address: entity.address,
      clubName: entity.clubName,
      resolvedAt: entity.resolvedAt,
      maxMembers: entity.maxMembers,
      requesterId: entity.requesterId,
      requestedAt: entity.requestedAt,
      rejectionReason: entity.rejectionReason,
    };
  }
}
