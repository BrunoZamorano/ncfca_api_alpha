import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { RegistrationConfirmed, RegistrationConfirmedPayload } from '@/domain/events/registration-confirmed.event';
import { SyncRegistrationUseCase } from '@/application/use-cases/tournament/sync-registration.use-case';

@Controller()
export class TournamentListener {
  private readonly logger = new Logger(TournamentListener.name);

  constructor(private readonly syncRegistrationUseCase: SyncRegistrationUseCase) {}

  @MessagePattern(RegistrationConfirmed.eventType)
  async handleRegistrationConfirmedEvent(@Payload() event: RegistrationConfirmedPayload, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.syncRegistrationUseCase.execute(event.registrationId);

      // Confirma que a mensagem foi processada com sucesso
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Erro ao processar confirmação de registro ${event.registrationId}:`, error);

      // Erro permanente - vai para DLQ
      this.logger.error(`Erro crítico ao processar registro ${event.registrationId}. Enviando para DLQ.`);
      channel.nack(originalMsg, false, false);
    }
  }
}
