import { Module } from '@nestjs/common';

import RegisterUser from '@/application/use-cases/register-user/register-user';

import AccountController from '@/infraestructure/controllers/account/account.controller';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';

import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, ID_GENERATOR } from '@/shared/constants/service-constants';

@Module({
  controllers: [AccountController],
  providers: [
    RegisterUser,
    { provide: FAMILY_REPOSITORY, useValue: new FamilyRepositoryMemory() },
    { provide: USER_REPOSITORY, useValue: new UserRepositoryMemory() },
    {
      provide: ID_GENERATOR,
      useValue: (() => {
        let id = 999;
        return { generate: () => `${id++}` };
      })(),
    },
    { provide: HASHING_SERVICE, useValue: { hash: () => '<hashed-pwd>', compare: () => true } },
  ],
  exports: [],
})
export default class AccountModule {}
