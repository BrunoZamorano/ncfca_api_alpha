import { Test, TestingModule } from '@nestjs/testing';

import RegisterUser from '@/application/use-cases/register-user/register-user';

import { RegisterUserInputDto } from '@/infraestructure/dtos/register-user.dto';

import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import AccountController from '@/infraestructure/controllers/account/account.controller';

import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, ID_GENERATOR } from '@/shared/constants/service-constants';

describe('AccountController', function () {
  let accountController: AccountController;
  let userRepository: UserRepositoryMemory;
  let familyRepository: FamilyRepositoryMemory;

  beforeEach(async function () {
    const app: TestingModule = await Test.createTestingModule({
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
    }).compile();

    accountController = app.get<AccountController>(AccountController);
    userRepository = app.get<UserRepositoryMemory>(USER_REPOSITORY);
    familyRepository = app.get<FamilyRepositoryMemory>(FAMILY_REPOSITORY);
  });

  it('Deve registrar um novo usuário, retornar os dados corretos e persistir o estado no sistema', async function () {
    const input: RegisterUserInputDto = {
      firstName: 'joao',
      lastName: 'silva',
      password: '123123',
      email: 'test@email.com',
    };
    const output = await accountController.registerUser(input);
    expect(output.firstName).toBe(input.firstName);
    expect(output.lastName).toBe(input.lastName);
    expect(output.email).toBe(input.email);
    expect(output['password']).toBeUndefined();
    const persistedUser = await userRepository.findByEmail(input.email);
    expect(persistedUser!.firstName).toBe(input.firstName);
    expect(persistedUser!.password).toBe('<hashed-pwd>');
    expect(persistedUser!.password).not.toBe(input.password);
    const persistedFamily = await familyRepository.findByHolderId(persistedUser!.id);
    expect(persistedFamily!.holderId).toBe(persistedUser!.id);
  });
});
