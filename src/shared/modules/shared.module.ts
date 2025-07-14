import { Module, Scope } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import UserFactory from '@/domain/factories/user.factory';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';

import TransactionRepositoryMemory from '@/infraestructure/repositories/transaction.memory-repository';
import { PaymentGatewayMemory } from '@/infraestructure/services/payment-gateway.memory';
import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
import AnemicHashingService from '@/infraestructure/services/anemic-hashing-service';
import { UnitOfWorkMemory } from '@/infraestructure/services/unit-of-work.memory';
import TokenServiceJwt from '@/infraestructure/services/token-service-jwt';
import UuidGenerator from '@/infraestructure/services/uuid-generator';

import {
  CLUB_REPOSITORY,
  FAMILY_REPOSITORY,
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from '@/shared/constants/repository-constants';
import { USER_FACTORY } from '@/shared/constants/factories-constants';
import { HASHING_SERVICE, ID_GENERATOR, PAYMENT_GATEWAY, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { ENROLLMENT_REQUEST_REPOSITORY } from '@/domain/repositories/enrollment-request-repository';
import EnrollmentRequestRepositoryMemory from '@/infraestructure/repositories/enrollment-request.repository.memory';
import { UnitOfWorkPrisma } from '@/infraestructure/services/unit-of-work.prisma';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyRepositoryPrisma } from '@/infraestructure/repositories/prisma/family.repository.prisma';
import { TransactionRepositoryPrisma } from '@/infraestructure/repositories/prisma/transaction.repository.prisma';
import { ClubRepositoryPrisma } from '@/infraestructure/repositories/prisma/club.repository.prisma';
import { UserRepositoryPrisma } from '@/infraestructure/repositories/prisma/user.repository.prisma';
import { EnrollmentRequestRepositoryPrisma } from '@/infraestructure/repositories/prisma/enrollment-request.repository.prisma';

const repositories = [
  { provide: FAMILY_REPOSITORY, useClass: FamilyRepositoryPrisma },
  { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepositoryPrisma },
  { provide: CLUB_REPOSITORY, useClass: ClubRepositoryPrisma },
  { provide: USER_REPOSITORY, useClass: UserRepositoryPrisma },
  { provide: ENROLLMENT_REQUEST_REPOSITORY, useClass: EnrollmentRequestRepositoryPrisma },
];

const services = [
  PrismaService,
  { provide: HASHING_SERVICE, useClass: AnemicHashingService },
  { provide: PAYMENT_GATEWAY, useClass: PaymentGatewayMemory },
  { provide: UNIT_OF_WORK, useClass: UnitOfWorkPrisma, scope: Scope.REQUEST },
  { provide: TOKEN_SERVICE, useClass: TokenServiceJwt },
  { provide: ID_GENERATOR, useClass: UuidGenerator },
];

const factories = [{ provide: USER_FACTORY, useClass: UserFactory }];

@Module({
  imports: [JwtModule.register({ global: true })],
  providers: [...repositories, ...services, ...factories],
  exports: [...repositories, ...services, ...factories],
})
export default class SharedModule {}
