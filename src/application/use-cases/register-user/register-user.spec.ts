import HashingService from '@/domain/services/hashing-service';
import TokenService from '@/application/services/token-service';
import IdGenerator from '@/application/services/id-generator';

import User from '@/domain/entities/user/user';
import Cpf from '@/domain/value-objects/cpf/cpf';

import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import AnemicTokenService from '@/infraestructure/services/anemic-token-service';

import RegisterUser from './register-user';
import UserFactory from '@/domain/factories/user.factory';
import UuidGenerator from '@/infraestructure/services/uuid-generator';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

describe('Register User', function () {
  const db = InMemoryDatabase.getInstance();
  let familyRepository: FamilyRepositoryMemory;
  let userRepository: UserRepositoryMemory;
  let hashingService: HashingService;
  let registerUser: RegisterUser;
  let tokenService: TokenService;
  let idGenerator: IdGenerator;

  beforeEach(() => {
    db.beginTransaction();
    familyRepository = new FamilyRepositoryMemory([]);
    hashingService = { hash: () => '<hashed-pwd>', compare: () => true };
    tokenService = new AnemicTokenService();
    idGenerator = new UuidGenerator();
    const userFactory = new UserFactory(hashingService, idGenerator);
    userRepository = new UserRepositoryMemory();
    registerUser = new RegisterUser(familyRepository, userRepository, tokenService, userFactory, idGenerator);
  });

  afterEach(() => {
    db.rollback();
  });

  it('Deve registrar um usuário', async function () {
    const props = {
      firstName: 'Jose',
      lastName: 'silva',
      password: '142B@l908',
      phone: '95991724765',
      email: 'user_rest12i2',
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
      password: User.DEFAULT_PASSWORD,
      phone: User.DEFAULT_PHONE,
      email: User.DEFAULT_EMAIL,
      cpf: Cpf.VALID_CPF,
    };
    await registerUser.execute(props);
    await expect(registerUser.execute(props)).rejects.toThrowError(RegisterUser.errorCodes.EMAIL_ALREADY_IN_USE);
  });

  it('Deve registrar o usuário com senha criptografada', async function () {
    const props = {
      firstName: 'Jose',
      lastName: 'silva',
      password: User.DEFAULT_PASSWORD,
      phone: User.DEFAULT_PHONE,
      email: User.DEFAULT_EMAIL,
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
      password: User.DEFAULT_PASSWORD,
      phone: User.DEFAULT_PHONE,
      email: User.DEFAULT_EMAIL,
      cpf: '<invalid-cpf>',
    };
    await expect(registerUser.execute(props)).rejects.toThrowError(RegisterUser.errorCodes.INVALID_CPF);
  });

  it('Deve retornar tokens de acesso e ao registrar um usuário', async function () {
    const props = {
      firstName: 'Jose',
      lastName: 'silva',
      password: User.DEFAULT_PASSWORD,
      phone: User.DEFAULT_PHONE,
      email: User.DEFAULT_EMAIL,
      cpf: Cpf.VALID_CPF,
    };
    const tokens = await registerUser.execute(props);
    expect(tokens).toBeDefined();
    expect(tokens!.accessToken).toBe(AnemicTokenService.ACCESS_TOKEN);
    expect(tokens!.refreshToken).toBe(AnemicTokenService.REFRESH_TOKEN);
  });
});
