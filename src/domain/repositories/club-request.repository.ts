import ClubRequest from '../entities/club-request/club-request.entity';

export interface ClubRequestRepository {
  findById(id: string): Promise<ClubRequest | null>;
  save(request: ClubRequest): Promise<ClubRequest>;
  listPending(): Promise<ClubRequest[]>;
  findByRequesterId(requesterId: string): Promise<ClubRequest[]>;
} 