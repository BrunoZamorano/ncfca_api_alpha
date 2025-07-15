import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UnitOfWork } from '@/domain/services/unit-of-work';
import { PrismaService } from '../database/prisma.service';
import {
  CLUB_REPOSITORY,
  FAMILY_REPOSITORY,
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from '@/shared/constants/repository-constants';
import EnrollmentRequestRepository, {
  ENROLLMENT_REQUEST_REPOSITORY,
} from '@/domain/repositories/enrollment-request-repository';
import ClubRepository from '@/domain/repositories/club-repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import UserRepository from '@/domain/repositories/user-repository';
import ClubMembershipRepository, { CLUB_MEMBERSHIP_REPOSITORY } from '@/domain/repositories/club-membership.repository';

@Injectable()
export class UnitOfWorkPrisma implements UnitOfWork {
  private prisma: PrismaClient;

  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(USER_REPOSITORY) public readonly userRepository: UserRepository,
    @Inject(CLUB_REPOSITORY) public readonly clubRepository: ClubRepository,
    @Inject(FAMILY_REPOSITORY) public readonly familyRepository: FamilyRepository,
    @Inject(TRANSACTION_REPOSITORY) public readonly transactionRepository: TransactionRepository,
    @Inject(CLUB_MEMBERSHIP_REPOSITORY) public readonly clubMembershipRepository: ClubMembershipRepository,
    @Inject(ENROLLMENT_REQUEST_REPOSITORY) public readonly enrollmentRequestRepository: EnrollmentRequestRepository,
  ) {
    this.prisma = this.prismaService;
  }

  async executeInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => {
      return await work();
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
