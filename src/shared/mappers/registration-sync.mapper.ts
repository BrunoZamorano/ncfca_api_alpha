import { RegistrationSync as Model } from '@prisma/client';

import Entity, { SyncStatus } from '@/domain/entities/registration/registration-sync.entity';

export class RegistrationSyncMapper {
  static toEntity(model: Model): Entity {
    return Entity.fromPersistence({
      id: model.id,
      status: model.status as SyncStatus,
      attempts: model.attempts,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      lastAttemptAt: model.last_attempt_at,
      nextAttemptAt: model.next_attempt_at,
      registrationId: model.registration_id,
    });
  }
}
