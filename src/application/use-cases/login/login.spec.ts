import HashingService from '@/application/services/hashing-service';
import TokenService from '@/application/services/token-service';
import { Login } from '@/application/use-cases/login/login';

import Family from '@/domain/entities/family/family';
import User from '@/domain/entities/user/user';

import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import AnemicTokenService from '@/infraestructure/services/anemic-token-service';

describe('Login', function () {
  let familyRepository: FamilyRepositoryMemory;
  let userRepository: UserRepositoryMemory;
  let hashingService: HashingService;
  let tokenService: TokenService;
  let dependencies: [FamilyRepositoryMemory, UserRepositoryMemory, HashingService, TokenService];
  let login: Login;

  beforeEach(() => {
    familyRepository = new FamilyRepositoryMemory([new Family({ id: '1', holderId: '1' })]);
    userRepository = new UserRepositoryMemory([new User({ id: '1' })]);
    hashingService = { hash: (pwd: string) => pwd, compare: (pwd: string, hash: string) => pwd === hash };
    tokenService = new AnemicTokenService();
    dependencies = [familyRepository, userRepository, hashingService, tokenService];
    login = new Login(...dependencies);
  });

  it('Deve realizar o login', async function () {
    const input = { email: User.DEFAULT_EMAIL, password: User.DEFAULT_PASSWORD };
    const output = await login.execute(input);
    expect(output.accessToken).toBeDefined();
    expect(output.refreshToken).toBeDefined();
  });

  it('Não deve realizar o login com email incorreto', async function () {
    const input = { email: 'invalid_email', password: User.DEFAULT_PASSWORD };
    await expect(login.execute(input)).rejects.toThrowError('INVALID_CREDENTIALS');
  });

  it('Não deve realizar o login com senha incorreta', async function () {
    const input = { email: User.DEFAULT_EMAIL, password: 'wrong_password' };
    await expect(login.execute(input)).rejects.toThrowError('INVALID_CREDENTIALS');
  });
});
