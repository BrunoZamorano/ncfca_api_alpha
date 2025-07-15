import EnrollmentRequestRepository from '@/domain/repositories/enrollment-request-repository';
import ClubMembershipRepository from '@/domain/repositories/club-membership.repository';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';
import ClubRepository from '@/domain/repositories/club-repository';

export interface UnitOfWork {
  readonly enrollmentRequestRepository: EnrollmentRequestRepository;
  readonly clubMembershipRepository: ClubMembershipRepository;
  readonly transactionRepository: TransactionRepository;
  readonly familyRepository: FamilyRepository;
  readonly clubRepository: ClubRepository;
  readonly userRepository: UserRepository;

  commit(): Promise<void>;
  rollback(): Promise<void>;
  beginTransaction(): Promise<void>;
  executeInTransaction<T>(work: () => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
