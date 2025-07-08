import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
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
import { USER_FACTORY } from '@/shared/constants/factories-constants';
import UserFactory from '@/domain/factories/user.factory';
import TransactionRepositoryMemory from '@/infraestructure/repositories/transaction.memory-repository';
import { PaymentGatewayMemory } from '@/infraestructure/services/payment-gateway.memory';

const repositories = [
  { provide: FAMILY_REPOSITORY, useFactory: () => new FamilyRepositoryMemory([]) },
  { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepositoryMemory },
  { provide: CLUB_REPOSITORY, useFactory: () => new ClubRepositoryMemory({ options: { totalClubs: 250 } }) },
  { provide: USER_REPOSITORY, useClass: UserRepositoryMemory },
];

const services = [
  { provide: HASHING_SERVICE, useClass: AnemicHashingService },
  {provide: PAYMENT_GATEWAY, useClass: PaymentGatewayMemory},
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
