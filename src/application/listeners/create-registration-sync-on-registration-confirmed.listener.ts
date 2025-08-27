import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RegistrationConfirmed } from '@/domain/events/registration-confirmed.event';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { SyncStatus } from '@prisma/client';

@Injectable()
export class CreateRegistrationSyncOnRegistrationConfirmed {
  private readonly logger = new Logger(CreateRegistrationSyncOnRegistrationConfirmed.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('registration.confirmed')
  async handleRegistrationConfirmedEvent(event: RegistrationConfirmed): Promise<void> {
    try {
      // Add a small delay to ensure the registration is committed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the registration exists first
      const registration = await this.prisma.registration.findUnique({
        where: { id: event.registrationId },
      });

      if (!registration) {
        this.logger.error(`Registration ${event.registrationId} not found when creating RegistrationSync`);
        return;
      }

      await this.prisma.registrationSync.create({
        data: {
          registration_id: event.registrationId,
          status: SyncStatus.PENDING,
        },
      });

      this.logger.log(`Created RegistrationSync for registration ${event.registrationId}`);
    } catch (error) {
      this.logger.error(`Error creating RegistrationSync for registration ${event.registrationId}:`, error);
      throw error;
    }
  }
}
