import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
import AnemicHashingService from '@/infraestructure/services/anemic-hashing-service';
import TokenServiceJwt from '@/infraestructure/services/token-service-jwt';
import UuidGenerator from '@/infraestructure/services/uuid-generator';

import { CLUB_REPOSITORY, FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';

const repositories = [
  { provide: FAMILY_REPOSITORY, useFactory: () => new FamilyRepositoryMemory([]) },
  { provide: CLUB_REPOSITORY, useFactory: () => new ClubRepositoryMemory({ options: { totalClubs: 250 } }) },
  { provide: USER_REPOSITORY, useFactory: () => new UserRepositoryMemory([]) },
];

const services = [
  { provide: HASHING_SERVICE, useClass: AnemicHashingService },
  { provide: TOKEN_SERVICE, useClass: TokenServiceJwt },
  { provide: ID_GENERATOR, useClass: UuidGenerator },
];

@Module({
  imports: [JwtModule.register({ global: true })],
  providers: [...repositories, ...services],
  exports: [...repositories, ...services],
})
export default class SharedModule {}
