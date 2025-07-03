import * as request from 'supertest';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';

import TokenService from '@/application/services/token-service';

import Cpf from '@/domain/value-objects/cpf/cpf';

import { ValidateTokenInputDto } from '@/infraestructure/dtos/validate-token.dto';
import { RegisterUserInputDto } from '@/infraestructure/dtos/register-user.dto';
import { RefreshTokenInputDto } from '@/infraestructure/dtos/refresh-token.dto';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';
import { LoginInputDto } from '@/infraestructure/dtos/login.dto';
import TokenServiceJwt from '@/infraestructure/services/token-service-jwt';

import { TOKEN_SERVICE } from '@/shared/constants/service-constants';

import { AppModule } from '@/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    tokenService = app.get<TokenServiceJwt>(TOKEN_SERVICE);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', function () {
    it('Deve logar no sistema', async function () {
      const testUser: RegisterUserInputDto = {
        firstName: 'E2E',
        lastName: 'User',
        password: 'Password@123',
        email: 'e2e-user@test.com',
        cpf: Cpf.VALID_CPF,
      };
      await request(app.getHttpServer()).post('/account/user').send(testUser).expect(201);
      const input: LoginInputDto = {
        email: testUser.email,
        password: testUser.password,
      };
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(input)
        .expect(200)
        .expect(async (res) => {
          expect(tokenService.decode(res.body.accessToken)).toBeTruthy();
          expect(tokenService.decode(res.body.refreshToken)).toBeTruthy();
        });
    });
  });

  describe('/auth/refresh-token (POST)', () => {
    it('deve renovar os tokens usando um refresh token válido', async () => {
      const testUser: RegisterUserInputDto = {
        firstName: 'E2E',
        lastName: 'User',
        password: 'Password@123',
        email: 'e2e-user@test.com',
        cpf: Cpf.VALID_CPF,
      };
      await request(app.getHttpServer()).post('/account/user').send(testUser).expect(201);
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);
      const originalRefreshToken = loginResponse.body.refreshToken;
      expect(originalRefreshToken).toBeDefined();
      const refreshTokenInput: RefreshTokenInputDto = {
        token: originalRefreshToken,
      };
      return request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send(refreshTokenInput)
        .expect(200)
        .expect(async (res) => {
          const newAccessToken = res.body.accessToken;
          const newRefreshToken = res.body.refreshToken;
          expect(newAccessToken).toBeDefined();
          expect(newRefreshToken).toBeDefined();
          expect(newRefreshToken).not.toBe(originalRefreshToken);
          const decodedPayload = await tokenService.decode(newAccessToken);
          expect(decodedPayload.email).toBe(testUser.email);
          expect(decodedPayload.sub).toBeDefined();
        });
    });

    it('deve retornar um erro se o refresh token for inválido', async () => {
      const input: RefreshTokenInputDto = {
        token: 'invalid.token.here',
      };

      return request(app.getHttpServer()).post('/auth/refresh-token').send(input).expect(401);
    });
  });

  describe('/auth/validate-token (POST)', () => {
    it('deve validar um token válido', async () => {
      const testUser: RegisterUserInputDto = {
        firstName: 'E2E',
        lastName: 'User',
        password: 'Password@123',
        email: 'e2e-user@test.com',
        cpf: Cpf.VALID_CPF,
      };
      await request(app.getHttpServer()).post('/account/user').send(testUser).expect(201);
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);
      const originalAccessToken = loginResponse.body.accessToken;
      expect(originalAccessToken).toBeDefined();
      const input: ValidateTokenInputDto = { token: originalAccessToken };
      return request(app.getHttpServer())
        .post('/auth/validate-token')
        .send(input)
        .expect(200)
        .expect(async (res) => {
          expect(tokenService.decode(res.body.accessToken)).toBeTruthy();
          expect(tokenService.decode(res.body.refreshToken)).toBeTruthy();
        });
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;
    const testUser: RegisterUserInputDto = {
      email: 'logout-user@test.com',
      password: 'Password@123',
      firstName: 'Logout',
      lastName: 'Test',
      cpf: Cpf.VALID_CPF,
    };

    // Arrange: Antes de cada teste de logout, criamos um usuário e fazemos login
    // para obter um token de acesso válido.
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/account/user').send(testUser);
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      accessToken = loginResponse.body.accessToken;
    });

    it('deve retornar status 204 para um usuário autenticado', async () => {
      // Act & Assert
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204)
        .then((response) => {
          expect(response.body).toEqual({});
        });
    });

    it('deve retornar status 401 se nenhum token for fornecido', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('deve retornar status 401 se o token for inválido ou malformado', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid.token.123') // Envia um token inválido
        .expect(401);
    });
  });
});
