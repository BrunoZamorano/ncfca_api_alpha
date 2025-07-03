import HashingService from '@/application/services/hashing-service';
import IdGenerator from '@/application/services/id-generator';

import Cpf from '@/domain/value-objects/cpf/cpf';

import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';

import RegisterUser from './register-user';
import TokenService, { Payload } from '@/application/services/token-service';
import AnemicTokenService from '@/infraestructure/services/anemic-token-service';

describe('Register User', function () {
  let familyRepository: FamilyRepositoryMemory;
  let userRepository: UserRepositoryMemory;
  let hashingService: HashingService;
  let registerUser: RegisterUser;
  let tokenService: TokenService;
  let idGenerator: IdGenerator;

  beforeEach(() => {
    familyRepository = new FamilyRepositoryMemory([]);
    userRepository = new UserRepositoryMemory([]);
    hashingService = { hash: () => '<hashed-pwd>', compare: () => true };
    tokenService = new AnemicTokenService();
    idGenerator = (() => {
      let id = 999;
      return { generate: () => `${id++}` };
    })();
    registerUser = new RegisterUser(familyRepository, userRepository, hashingService, tokenService, idGenerator);
  });

  it('Deve registrar um usuário', async function () {
    const props = {
      firstName: 'Jose',
      lastName: 'silva',
      password: '123123',
      email: 'jose.silva@test.com',
      cpf: Cpf.VALID_CPF,
    };
    await registerUser.execute(props);
    const user = await userRepository.findByEmail(props.email);
    const family = await familyRepository.findByHolderId(user!.id);
    expect(family!.holderId).toBe(user!.id);
    expect(user!.firstName).toBe(props.firstName);
    expect(user!.lastName).toBe(props.lastName);
    expect(user!.email).toBe(props.email);
    expect(user!.cpf).toBe(props.cpf);
  });

  it('Não deve registrar um usuário com email já existente', async function () {
    const props = {
      firstName: 'Jose',
      lastName: 'silva',
      password: '123123',
      email: 'eg@email.com',
      cpf: Cpf.VALID_CPF,
    };
    await registerUser.execute(props);
    await expect(registerUser.execute(props)).rejects.toThrowError(RegisterUser.errorCodes.EMAIL_ALREADY_IN_USE);
  });

  it('Deve registrar o usuário com senha criptografada', async function () {
    const props = {
      firstName: 'Jose',
      lastName: 'silva',
      password: '123123',
      email: 'eg@email.com',
      cpf: Cpf.VALID_CPF,
    };
    await registerUser.execute(props);
    const user = await userRepository.findByEmail(props.email);
    expect(user).toBeDefined();
    expect(user!.password).not.toBe(props.password);
  });

  it('Não deve registrar um usuário com CPF inválido', async function () {
    const props = {
      firstName: 'Jose',
      lastName: 'silva',
      password: '123123',
      email: 'eg@email.com',
      cpf: '<invalid-cpf>',
    };
    await expect(registerUser.execute(props)).rejects.toThrowError(RegisterUser.errorCodes.INVALID_CPF);
  });

  it('Deve retornar tokens de acesso e ao registrar um usuário', async function () {
    const props = {
      firstName: 'Jose',
      lastName: 'silva',
      password: '123123',
      email: 'eg@email.com',
      cpf: Cpf.VALID_CPF,
    };
    const tokens = await registerUser.execute(props);
    expect(tokens).toBeDefined();
    expect(tokens!.accessToken).toBe(AnemicTokenService.ACCESS_TOKEN);
    expect(tokens!.refreshToken).toBe(AnemicTokenService.REFRESH_TOKEN);
  });
});
