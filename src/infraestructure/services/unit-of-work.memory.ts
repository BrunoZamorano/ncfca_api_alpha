import { UnitOfWork } from '@/domain/services/unit-of-work';
import ClubRepository from '@/domain/repositories/club-repository';
import UserRepository from '@/domain/repositories/user-repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import TransactionRepositoryMemory from '@/infraestructure/repositories/transaction.memory-repository';
import { Inject } from '@nestjs/common';
import {
  CLUB_REPOSITORY,
  FAMILY_REPOSITORY,
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from '@/shared/constants/repository-constants';

export class UnitOfWorkMemory implements UnitOfWork {
  private readonly db: InMemoryDatabase;

  public constructor(
    @Inject(USER_REPOSITORY) public readonly userRepository: UserRepository,
    @Inject(CLUB_REPOSITORY) public readonly clubRepository: ClubRepository,
    @Inject(FAMILY_REPOSITORY) public readonly familyRepository: FamilyRepository,
    @Inject(TRANSACTION_REPOSITORY) public readonly transactionRepository: TransactionRepository,
  ) {
    this.db = InMemoryDatabase.getInstance();
  }

  async beginTransaction(): Promise<void> {
    this.db.beginTransaction();
  }

  async rollback(): Promise<void> {
    this.db.rollback();
  }

  async commit(): Promise<void> {
    try {
      this.db.commit();
    } catch (error) {
      this.db.rollback();
      throw error;
    }
  }
}
