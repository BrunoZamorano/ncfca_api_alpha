import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import EnrollmentRequestRepository, { ENROLLMENT_REQUEST_REPOSITORY } from '@/domain/repositories/enrollment-request-repository';
import ClubMembershipRepository, { CLUB_MEMBERSHIP_REPOSITORY } from '@/domain/repositories/club-membership.repository';
import { ClubRequestRepository } from '@/domain/repositories/club-request.repository';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import { UnitOfWork } from '@/domain/services/unit-of-work';
import ClubRepository from '@/domain/repositories/club-repository';
import UserRepository from '@/domain/repositories/user-repository';

import { PrismaService } from '@/infraestructure/database/prisma.service';

import {
  CLUB_REQUEST_REPOSITORY,
  TRANSACTION_REPOSITORY,
  FAMILY_REPOSITORY,
  CLUB_REPOSITORY,
  USER_REPOSITORY,
} from '@/shared/constants/repository-constants';

@Injectable()
export class UnitOfWorkPrisma implements UnitOfWork {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(USER_REPOSITORY) public readonly userRepository: UserRepository,
    @Inject(CLUB_REPOSITORY) public readonly clubRepository: ClubRepository,
    @Inject(FAMILY_REPOSITORY) public readonly familyRepository: FamilyRepository,
    @Inject(TRANSACTION_REPOSITORY) public readonly transactionRepository: TransactionRepository,
    @Inject(CLUB_REQUEST_REPOSITORY) public readonly clubRequestRepository: ClubRequestRepository,
    @Inject(CLUB_MEMBERSHIP_REPOSITORY) public readonly clubMembershipRepository: ClubMembershipRepository,
    @Inject(ENROLLMENT_REQUEST_REPOSITORY) public readonly enrollmentRequestRepository: EnrollmentRequestRepository,
  ) {}

  async executeInTransaction<T>(work: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (transaction) => {
      return await work(transaction);
    });
  }

  async beginTransaction(): Promise<void> {
    throw new NotImplementedException('Operation is not allowed');
  }
  async commit(): Promise<void> {
    throw new NotImplementedException('Operation is not allowed');
  }
  async rollback(): Promise<void> {
    throw new NotImplementedException('Operation is not allowed');
  }
}
