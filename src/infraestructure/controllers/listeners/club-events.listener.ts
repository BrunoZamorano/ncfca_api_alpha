import { Controller, Inject, Logger } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { ClubRequestApprovedEvent, ClubRequestApprovedEventPayload } from '@/domain/events/club-request-approved.event';
import CreateClub from '@/application/use-cases/club/create-club/create-club';

@Controller()
export class ClubEventsListener {
  private readonly logger = new Logger(ClubEventsListener.name);

  constructor(@Inject(CreateClub) private readonly createClub: CreateClub) {}

  @EventPattern(ClubRequestApprovedEvent.eventType)
  async handleClubRequestApproved(@Payload() event: ClubRequestApprovedEventPayload, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.debug(`Processando aprovação de clube para request: ${event.requestId}`);

      const result = await this.createClub.execute({ requestId: event.requestId });

      this.logger.log(`Clube criado com sucesso: ${result.club.id} para request: ${event.requestId}`);

      // Confirma que a mensagem foi processada com sucesso
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Erro ao processar aprovação de clube para request ${event.requestId}:`, error);

      if (error.name === 'EntityNotFoundException') {
        this.logger.warn(`ClubRequest ${event.requestId} não encontrado. Descartando mensagem órfã.`);
        // Para ClubRequest não encontrado, apenas confirma a mensagem (remove da fila)
        channel.ack(originalMsg);
      } else {
        this.logger.error(`Erro crítico ao processar request ${event.requestId}. Rejeitando mensagem.`);
        // Para outros erros, rejeita sem requeue
        channel.nack(originalMsg, false, false);
      }
    }
  }
}
