import { Test, TestingModule } from '@nestjs/testing';

import RegisterUser from '@/application/use-cases/register-user/register-user';

import Cpf from '@/domain/value-objects/cpf/cpf';

import { RegisterUserInputDto } from '@/infraestructure/dtos/register-user.dto';
import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import AnemicHashingService from '@/infraestructure/services/anemic-hashing-service';
import AnemicTokenService from '@/infraestructure/services/anemic-token-service';
import AccountController from '@/infraestructure/controllers/account/account.controller';
import UuidGenerator from '@/infraestructure/services/uuid-generator';

import { HASHING_SERVICE, ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import User from '@/domain/entities/user/user';
import { USER_FACTORY } from '@/shared/constants/factories-constants';
import UserFactory from '@/domain/factories/user.factory';

describe('AccountController', function () {
  let accountController: AccountController;
  let familyRepository: FamilyRepositoryMemory;
  let userRepository: UserRepositoryMemory;
  let hashingService: AnemicHashingService;

  beforeEach(async function () {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        { provide: FAMILY_REPOSITORY, useValue: new FamilyRepositoryMemory() },
        { provide: USER_REPOSITORY, useClass: UserRepositoryMemory },
        { provide: HASHING_SERVICE, useClass: AnemicHashingService },
        { provide: TOKEN_SERVICE, useClass: AnemicTokenService },
        { provide: ID_GENERATOR, useClass: UuidGenerator },
        { provide: USER_FACTORY, useClass: UserFactory },
        RegisterUser,
      ],
    }).compile();

    accountController = app.get<AccountController>(AccountController);
    familyRepository = app.get<FamilyRepositoryMemory>(FAMILY_REPOSITORY);
    userRepository = app.get<UserRepositoryMemory>(USER_REPOSITORY);
    hashingService = app.get<AnemicHashingService>(HASHING_SERVICE);
  });

  describe('RegisterUser', function () {
    it('Deve registrar um novo usuário, retornar os dados corretos e persistir o estado no sistema', async function () {
      const input: RegisterUserInputDto = {
        password: User.DEFAULT_PASSWORD,
        firstName: 'joao',
        lastName: 'silva',
        phone: '95991724765',
        email: 'test@email.com',
        cpf: Cpf.VALID_CPF,
      };
      const output = await accountController.registerUser(input);
      expect(output.accessToken).toBe(AnemicTokenService.ACCESS_TOKEN);
      expect(output.refreshToken).toBe(AnemicTokenService.REFRESH_TOKEN);
      const persistedUser = await userRepository.findByEmail(input.email);
      if (!persistedUser) throw new Error('USER_NOT_PERSISTED');
      expect(persistedUser.firstName).toBe(input.firstName);
      expect(persistedUser.lastName).toBe(input.lastName);
      expect(persistedUser.email).toBe(input.email);
      expect(persistedUser.firstName).toBe(input.firstName);
      expect(hashingService.compare(input.password, persistedUser.password)).toBeTruthy();
      expect(persistedUser.password).not.toBe(input.password);
      const persistedFamily = await familyRepository.findByHolderId(persistedUser.id);
      if (!persistedFamily) throw new Error('FAMILY_NOT_PERSISTED');
      expect(persistedFamily.holderId).toBe(persistedUser.id);
    });
  });
});
