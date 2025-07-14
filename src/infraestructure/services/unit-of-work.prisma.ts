// src/infraestructure/services/unit-of-work.prisma.ts
import { Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class UnitOfWorkPrisma implements UnitOfWork {
  private prisma: PrismaClient;

  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(USER_REPOSITORY) public readonly userRepository: UserRepository,
    @Inject(CLUB_REPOSITORY) public readonly clubRepository: ClubRepository,
    @Inject(FAMILY_REPOSITORY) public readonly familyRepository: FamilyRepository,
    @Inject(TRANSACTION_REPOSITORY) public readonly transactionRepository: TransactionRepository,
    @Inject(ENROLLMENT_REQUEST_REPOSITORY) public readonly enrollmentRequestRepository: EnrollmentRequestRepository,
  ) {
    this.prisma = this.prismaService;
  }

  // A implementação de transação do Prisma é robusta.
  // O método $transaction garante que todas as operações dentro do callback
  // sejam executadas em uma única transação. Se qualquer uma falhar,
  // um rollback automático é executado.
  async executeInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => {
      return await work();
    });
  }

  // Para o Prisma, begin, commit e rollback são gerenciados pelo $transaction.
  // Estes métodos podem ser mantidos para compatibilidade de interface, mas
  // o uso principal deve ser através do executeInTransaction.
  async beginTransaction(): Promise<void> { /* No-op */ }
  async commit(): Promise<void> { /* No-op */ }
  async rollback(): Promise<void> { /* No-op */ }
}