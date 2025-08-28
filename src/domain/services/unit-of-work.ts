import EnrollmentRequestRepository from '@/domain/repositories/enrollment-request-repository';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import ClubMembershipRepository from '@/domain/repositories/club-membership.repository';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';
import ClubRepository from '@/domain/repositories/club-repository';
import { TournamentRepository } from '@/domain/repositories/tournament.repository';

export interface UnitOfWork {
  readonly enrollmentRequestRepository: EnrollmentRequestRepository;
  readonly clubMembershipRepository: ClubMembershipRepository;
  readonly clubRequestRepository: ClubRequestRepository;
  readonly transactionRepository: TransactionRepository;
  readonly familyRepository: FamilyRepository;
  readonly clubRepository: ClubRepository;
  readonly userRepository: UserRepository;
  readonly tournamentRepository: TournamentRepository;

  commit(): Promise<void>;
  rollback(): Promise<void>;
  beginTransaction(): Promise<void>;
  executeInTransaction<T>(work: (...args: any[]) => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
