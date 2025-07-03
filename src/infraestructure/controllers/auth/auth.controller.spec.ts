import { Test, TestingModule } from '@nestjs/testing';

import ValidateToken from '@/application/use-cases/validate-token/validate-token';
import RefreshToken from '@/application/use-cases/refresh-token/refresh-token';
import Login from '@/application/use-cases/login/login';

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
import { HASHING_SERVICE, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import Logout from '@/application/use-cases/logout/logout';

describe('AuthController', function () {
  let authController: AuthController;

  beforeEach(async function () {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: FAMILY_REPOSITORY, useValue: new FamilyRepositoryMemory() },
        { provide: USER_REPOSITORY, useValue: new UserRepositoryMemory() },
        { provide: HASHING_SERVICE, useClass: AnemicHashingService },
        { provide: TOKEN_SERVICE, useClass: AnemicTokenService },
        ValidateToken,
        RefreshToken,
        Logout,
        Login,
      ],
    }).compile();
    authController = app.get<AuthController>(AuthController);
  });

  describe('Login', function () {
    it('Deve realizar o login', async function () {
      const input: LoginInputDto = {
        email: User.DEFAULT_EMAIL,
        password: User.DEFAULT_PASSWORD,
      };
      const output = await authController.login(input);
      expect(output.accessToken).toBe(AnemicTokenService.ACCESS_TOKEN);
      expect(output.refreshToken).toBe(AnemicTokenService.REFRESH_TOKEN);
    });

    it('Não deve realizar o login com email incorreto', async function () {
      const input: LoginInputDto = {
        email: 'invalid_email',
        password: User.DEFAULT_PASSWORD,
      };
      await expect(authController.login(input)).rejects.toThrowError(Login.errorCodes.INVALID_CREDENTIALS);
    });

    it('Não deve realizar o login com senha incorreta', async function () {
      const input: LoginInputDto = {
        email: User.DEFAULT_EMAIL,
        password: 'wrong_password',
      };
      await expect(authController.login(input)).rejects.toThrowError(Login.errorCodes.INVALID_CREDENTIALS);
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
