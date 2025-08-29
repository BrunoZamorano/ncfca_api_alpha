import { Test, TestingModule } from '@nestjs/testing';

import ValidateToken from '@/application/use-cases/auth/validate-token/validate-token.use-case';
import RefreshToken from '@/application/use-cases/auth/refresh-token/refresh-token.use-case';
import Login from '@/application/use-cases/auth/login/login.use-case';

import User from '@/domain/entities/user/user';

import { ValidateTokenInputDto } from '@/infraestructure/dtos/validate-token.dto';
import { RefreshTokenInputDto } from '@/infraestructure/dtos/refresh-token.dto';
import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import AnemicHashingService from '@/infraestructure/services/anemic-hashing-service';
import AnemicTokenService from '@/infraestructure/services/anemic-token-service';
import { LoginInputDto } from '@/infraestructure/dtos/login.dto';
import AuthController from '@/infraestructure/controllers/auth/auth.controller';

import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import Logout from '@/application/use-cases/auth/logout/logout.use-case';
import UuidGenerator from '@/infraestructure/services/uuid-generator';
import Family from '@/domain/entities/family/family';
import Password from '@/domain/value-objects/password/password';

describe('AuthController', function () {
  let authController: AuthController;
  let userRepository: UserRepositoryMemory;
  let familyRepository: FamilyRepositoryMemory;

  beforeEach(async function () {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: FAMILY_REPOSITORY, useValue: new FamilyRepositoryMemory() },
        { provide: USER_REPOSITORY, useClass: UserRepositoryMemory },
        { provide: HASHING_SERVICE, useClass: AnemicHashingService },
        { provide: TOKEN_SERVICE, useClass: AnemicTokenService },
        { provide: ID_GENERATOR, useClass: UuidGenerator },
        ValidateToken,
        RefreshToken,
        Logout,
        Login,
      ],
    }).compile();
    authController = app.get<AuthController>(AuthController);
    userRepository = app.get<UserRepositoryMemory>(USER_REPOSITORY);
    familyRepository = app.get<FamilyRepositoryMemory>(FAMILY_REPOSITORY);
  });

  describe('Login', function () {
    it('Deve realizar o login', async function () {
      const input: LoginInputDto = {
        email: User.DEFAULT_EMAIL,
        password: User.DEFAULT_PASSWORD,
      };
      // Create test user directly using populate with compatible data
      const mockUser = {
        id: '1',
        _email: { value: User.DEFAULT_EMAIL },
        _password: Password.fromHash(User.DEFAULT_PASSWORD + 'secret'),
        firstName: 'Test',
        lastName: 'User',
        rg: '123456789',
        _cpf: { value: '123.456.789-10' },
        phone: '11999999999',
        roles: ['USER'],
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test',
        city: 'Test City',
        state: 'SP',
        zipCode: '12345-678',
        get password() {
          return this._password.value;
        },
        get email() {
          return this._email.value;
        },
      };
      (userRepository as any).db.users.push(mockUser);
      await familyRepository.create(new Family({ id: '1', holderId: '1' }));
      const output = await authController.login(input);
      expect(output.accessToken).toBe(AnemicTokenService.ACCESS_TOKEN);
      expect(output.refreshToken).toBe(AnemicTokenService.REFRESH_TOKEN);
    });

    it('Não deve realizar o login com email incorreto', async function () {
      const input: LoginInputDto = {
        email: 'invalid_email',
        password: User.DEFAULT_PASSWORD,
      };
      await expect(authController.login(input)).rejects.toThrow(Login.errorCodes.INVALID_CREDENTIALS);
    });

    it('Não deve realizar o login com senha incorreta', async function () {
      const input: LoginInputDto = {
        email: User.DEFAULT_EMAIL,
        password: 'wrong_password',
      };
      await expect(authController.login(input)).rejects.toThrow(Login.errorCodes.INVALID_CREDENTIALS);
    });
  });

  describe('Refresh Token', function () {
    it('Deve renovar os tokens usando um refresh token válido', async () => {
      const input: RefreshTokenInputDto = {
        token: AnemicTokenService.REFRESH_TOKEN,
      };
      const output = await authController.refreshToken(input);
      expect(output.accessToken).toBe(AnemicTokenService.ACCESS_TOKEN);
      expect(output.refreshToken).toBe(AnemicTokenService.REFRESH_TOKEN);
    });
  });

  describe('Validate Token', function () {
    it('Deve validar um token válido', async () => {
      const input: ValidateTokenInputDto = { token: AnemicTokenService.ACCESS_TOKEN };
      const output = await authController.validateToken(input);
      const decoded = AnemicTokenService.stubDecodedToken;
      expect(output.familyId).toBe(decoded.familyId);
      expect(output.email).toBe(decoded.email);
      expect(output.roles).toBe(decoded.roles);
      expect(output.sub).toBe(decoded.sub);
      expect(output.iat).toBeDefined();
      expect(output.exp).toBeDefined();
    });
  });

  describe('Logout', function () {
    it('Deve retornar nada pois o logout stateless e gerenciado pelo cliente', async function () {
      await expect(authController.logout()).resolves.toBe(void 0);
    });
  });
});
