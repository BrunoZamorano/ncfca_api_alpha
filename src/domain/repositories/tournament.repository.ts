import Tournament from '@/domain/entities/tournament/tournament.entity';

export interface TournamentRepository {
  save(tournament: Tournament): Promise<void>;
  findById(id: string): Promise<Tournament | null>;
  findByRegistrationId(registrationId: string): Promise<Tournament | null>;
}
