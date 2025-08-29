import { Inject, Injectable, Logger } from '@nestjs/common';
import { TournamentRepository } from '@/domain/repositories/tournament.repository';
import { SyncStatus } from '@/domain/entities/registration/registration-sync.entity';
import { TOURNAMENT_REPOSITORY } from '@/shared/constants/repository-constants';

@Injectable()
export class SyncRegistrationUseCase {
  private readonly logger = new Logger(SyncRegistrationUseCase.name);

  constructor(
    @Inject(TOURNAMENT_REPOSITORY)
    private readonly tournamentRepository: TournamentRepository,
  ) {}

  async execute(registrationId: string): Promise<void> {
    this.logger.debug(`Processando confirmação de registro: ${registrationId}`);

    // Buscar Tournament que contém a Registration
    const tournament = await this.tournamentRepository.findByRegistrationId(registrationId);

    if (!tournament) {
      this.logger.warn(`Tournament não encontrado para registration ${registrationId}. Descartando mensagem órfã.`);
      return;
    }

    // Encontrar a Registration específica
    const registration = tournament.registrations.find((reg) => reg.id === registrationId);

    if (!registration) {
      this.logger.warn(`Registration ${registrationId} não encontrada no Tournament. Descartando mensagem órfã.`);
      return;
    }

    // Atualizar status do RegistrationSync para SYNCED
    registration.sync.updateSyncStatus(SyncStatus.SYNCED);

    // Salvar Tournament com Registration e RegistrationSync atualizados
    await this.tournamentRepository.save(tournament);

    this.logger.log(`Updated RegistrationSync status to SYNCED for registration ${registrationId}`);
  }
}
