import ClubRequest from '../entities/club-request/club-request.entity';

export interface ClubRequestRepository {
  save(request: ClubRequest): Promise<ClubRequest>;
  findById(id: string): Promise<ClubRequest | null>;
  listPending(): Promise<ClubRequest[]>;
  findByRequesterId(requesterId: string): Promise<ClubRequest[]>;
  listPendingByRequesterId(requesterId: string): Promise<ClubRequest[]>;
}
