import { Controller, Inject, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { DuoRegistrationAccepted, DuoRegistrationAcceptedPayload } from '@/domain/events/duo-registration-accepted.event';
import { ConfirmDuoRegistration } from '@/application/use-cases/tournaments/confirm-registration/confirm-duo-registration.use-case';

@Controller()
export class DuoRegistrationAcceptedListener {
  private readonly logger = new Logger(DuoRegistrationAcceptedListener.name);

  constructor(@Inject(ConfirmDuoRegistration) private readonly confirmDuoRegistration: ConfirmDuoRegistration) {}

  @EventPattern(DuoRegistrationAccepted.eventType)
  async handleDuoRegistrationAccepted(@Payload() event: DuoRegistrationAcceptedPayload, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.debug(`Processando confirmação de registro de dupla: ${event.registrationId}`);

      await this.confirmDuoRegistration.execute({
        registrationId: event.registrationId,
        tournamentId: event.tournamentId,
        competitorId: event.competitorId,
        partnerId: event.partnerId,
      });

      this.logger.log(`Confirmação de registro de dupla processada com sucesso: ${event.registrationId}`);

      // Confirma que a mensagem foi processada com sucesso
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Erro ao processar confirmação de registro de dupla ${event.registrationId}:`, error);

      if (error.name === 'EntityNotFoundException') {
        this.logger.warn(`Registro ou Tournament ${event.registrationId} não encontrado. Descartando mensagem órfã.`);
        // Para registros não encontrados, apenas confirma a mensagem (remove da fila)
        channel.ack(originalMsg);
      } else {
        this.logger.error(`Erro crítico ao processar registro ${event.registrationId}. Rejeitando mensagem.`);
        // Para outros erros, rejeita sem requeue
        channel.nack(originalMsg, false, false);
      }
    }
  }
}
