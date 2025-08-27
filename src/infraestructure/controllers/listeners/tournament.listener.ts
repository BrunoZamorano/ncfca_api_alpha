import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { SyncStatus } from '@prisma/client';
import { RegistrationConfirmed } from '@/domain/events/registration-confirmed.event';

@Controller()
export class TournamentListener {
  private readonly logger = new Logger(TournamentListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @MessagePattern('Registration.Confirmed')
  async handleRegistrationConfirmedEvent(@Payload() data: RegistrationConfirmed, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.debug(`Processando confirmação de registro: ${data.registrationId}`);

      // Update the RegistrationSync record status to SYNCED
      await this.prisma.registrationSync.update({
        where: {
          registration_id: data.registrationId,
        },
        data: {
          status: SyncStatus.SYNCED,
        },
      });

      this.logger.log(`Updated RegistrationSync status to SYNCED for registration ${data.registrationId}`);
      
      // Confirma que a mensagem foi processada com sucesso
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Erro ao processar confirmação de registro ${data.registrationId}:`, error);
      
      if (error.code === 'P2025') { // Prisma record not found
        this.logger.warn(`RegistrationSync ${data.registrationId} não encontrado. Descartando mensagem órfã.`);
        channel.ack(originalMsg);
      } else {
        this.logger.error(`Erro crítico ao processar registro ${data.registrationId}. Rejeitando mensagem.`);
        channel.nack(originalMsg, false, false);
      }
    }
  }
}
