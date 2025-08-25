import { Module, Scope } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { ENROLLMENT_REQUEST_REPOSITORY } from '@/domain/repositories/enrollment-request-repository';
import { CLUB_MEMBERSHIP_REPOSITORY } from '@/domain/repositories/club-membership.repository';
import { TRAINING_REPOSITORY } from '@/domain/repositories/training.repository';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';


import { QUERY_SERVICE } from '@/application/services/query.service';

import { EnrollmentRequestRepositoryPrisma } from '@/infraestructure/repositories/prisma/enrollment-request.repository.prisma';
import { ClubMembershipRepositoryPrisma } from '@/infraestructure/repositories/prisma/club-membership.repository.prisma';
import { TransactionRepositoryPrisma } from '@/infraestructure/repositories/prisma/transaction.repository.prisma';
import { TrainingRepositoryPrisma } from '@/infraestructure/repositories/prisma/training.repository.prisma';
import { FamilyRepositoryPrisma } from '@/infraestructure/repositories/prisma/family.repository.prisma';
import { EnrollmentQueryPrisma } from '@/infraestructure/queries/enrollment.query.prisma';
import { HashingServiceBcrypt } from '@/infraestructure/services/hashing-bcrypct.service';
import { ClubRepositoryPrisma } from '@/infraestructure/repositories/prisma/club.repository.prisma';
import { UserRepositoryPrisma } from '@/infraestructure/repositories/prisma/user.repository.prisma';
import { DependantQueryPrisma } from '@/infraestructure/queries/dependant.query.prisma';
import { PaymentGatewayMemory } from '@/infraestructure/services/payment-gateway.memory';
import { TrainingQueryPrisma } from '@/infraestructure/queries/training.query.prisma';
import { ClubQueryPrisma } from '@/infraestructure/queries/club.query.prisma';
import { UnitOfWorkPrisma } from '@/infraestructure/services/unit-of-work.prisma';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import QueryServicePrisma from '@/infraestructure/services/query.service.prisma';
import TokenServiceJwt from '@/infraestructure/services/token-service-jwt';
import UuidGenerator from '@/infraestructure/services/uuid-generator';

import {
  CLUB_REPOSITORY,
  CLUB_REQUEST_REPOSITORY,
  FAMILY_REPOSITORY,
  TRANSACTION_REPOSITORY,
  TOURNAMENT_REPOSITORY,
  USER_REPOSITORY,
} from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, ID_GENERATOR, PAYMENT_GATEWAY, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { ClubRequestRepositoryPrisma } from '@/infraestructure/repositories/prisma/club-request.repository.prisma';
import { CLUB_QUERY, DEPENDANT_QUERY, ENROLLMENT_QUERY, TOURNAMENT_QUERY, TRAINING_QUERY } from '../constants/query-constants';
import { PrismaTournamentRepository } from '@/infraestructure/repositories/prisma/tournament.repository.prisma';
import { PrismaTournamentQuery } from '@/infraestructure/queries/tournament/prisma-tournament.query';

const repositories = [
  { provide: ENROLLMENT_REQUEST_REPOSITORY, useClass: EnrollmentRequestRepositoryPrisma },
  { provide: CLUB_MEMBERSHIP_REPOSITORY, useClass: ClubMembershipRepositoryPrisma },
  { provide: CLUB_REQUEST_REPOSITORY, useClass: ClubRequestRepositoryPrisma },
  { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepositoryPrisma },
  { provide: TRAINING_REPOSITORY, useClass: TrainingRepositoryPrisma },
  { provide: FAMILY_REPOSITORY, useClass: FamilyRepositoryPrisma },
  { provide: CLUB_REPOSITORY, useClass: ClubRepositoryPrisma },
  { provide: TOURNAMENT_REPOSITORY, useClass: PrismaTournamentRepository },
  { provide: USER_REPOSITORY, useClass: UserRepositoryPrisma },
];

const queries = [
  { provide: ENROLLMENT_QUERY, useClass: EnrollmentQueryPrisma },
  { provide: DEPENDANT_QUERY, useClass: DependantQueryPrisma },
  { provide: TRAINING_QUERY, useClass: TrainingQueryPrisma },
  { provide: CLUB_QUERY, useClass: ClubQueryPrisma },
  { provide: TOURNAMENT_QUERY, useClass: PrismaTournamentQuery },
];

const services = [
  PrismaService,
  { provide: UNIT_OF_WORK, useClass: UnitOfWorkPrisma, scope: Scope.REQUEST },
  { provide: HASHING_SERVICE, useClass: HashingServiceBcrypt },
  { provide: PAYMENT_GATEWAY, useClass: PaymentGatewayMemory },
  { provide: QUERY_SERVICE, useClass: QueryServicePrisma },
  { provide: TOKEN_SERVICE, useClass: TokenServiceJwt },
  { provide: ID_GENERATOR, useClass: UuidGenerator },
];

@Module({
  imports: [JwtModule.register({ global: true })],
  providers: [...repositories, ...services, ...queries],
  exports: [...repositories, ...services, ...queries],
})
export default class SharedModule {}
