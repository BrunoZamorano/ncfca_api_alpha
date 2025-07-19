import { Module, Scope } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';

import { PaymentGatewayMemory } from '@/infraestructure/services/payment-gateway.memory';
import AnemicHashingService from '@/infraestructure/services/anemic-hashing-service';
import TokenServiceJwt from '@/infraestructure/services/token-service-jwt';
import UuidGenerator from '@/infraestructure/services/uuid-generator';

import {
  CLUB_REPOSITORY,
  FAMILY_REPOSITORY,
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, ID_GENERATOR, PAYMENT_GATEWAY, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { ENROLLMENT_REQUEST_REPOSITORY } from '@/domain/repositories/enrollment-request-repository';
import { UnitOfWorkPrisma } from '@/infraestructure/services/unit-of-work.prisma';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { FamilyRepositoryPrisma } from '@/infraestructure/repositories/prisma/family.repository.prisma';
import { TransactionRepositoryPrisma } from '@/infraestructure/repositories/prisma/transaction.repository.prisma';
import { ClubRepositoryPrisma } from '@/infraestructure/repositories/prisma/club.repository.prisma';
import { UserRepositoryPrisma } from '@/infraestructure/repositories/prisma/user.repository.prisma';
import { EnrollmentRequestRepositoryPrisma } from '@/infraestructure/repositories/prisma/enrollment-request.repository.prisma';
import { CLUB_MEMBERSHIP_REPOSITORY } from '@/domain/repositories/club-membership.repository';
import { ClubMembershipRepositoryPrisma } from '@/infraestructure/repositories/prisma/club-membership.repository.prisma';
import { HashingServiceBcrypt } from '@/infraestructure/services/hashing-bcrypct.service';

const repositories = [
  { provide: FAMILY_REPOSITORY, useClass: FamilyRepositoryPrisma },
  { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepositoryPrisma },
  { provide: CLUB_REPOSITORY, useClass: ClubRepositoryPrisma },
  { provide: USER_REPOSITORY, useClass: UserRepositoryPrisma },
  { provide: CLUB_MEMBERSHIP_REPOSITORY, useClass: ClubMembershipRepositoryPrisma },
  { provide: ENROLLMENT_REQUEST_REPOSITORY, useClass: EnrollmentRequestRepositoryPrisma },
];

const services = [
  PrismaService,
  { provide: HASHING_SERVICE, useClass: HashingServiceBcrypt },
  { provide: PAYMENT_GATEWAY, useClass: PaymentGatewayMemory },
  { provide: UNIT_OF_WORK, useClass: UnitOfWorkPrisma, scope: Scope.REQUEST },
  { provide: TOKEN_SERVICE, useClass: TokenServiceJwt },
  { provide: ID_GENERATOR, useClass: UuidGenerator },
];

@Module({
  imports: [JwtModule.register({ global: true })],
  providers: [...repositories, ...services],
  exports: [...repositories, ...services],
})
export default class SharedModule {}
