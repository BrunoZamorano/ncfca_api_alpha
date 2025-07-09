import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';

import Cpf from '@/domain/value-objects/cpf/cpf';
import { RegisterUserInputDto } from '@/infraestructure/dtos/register-user.dto';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import { USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { AppModule } from '@/app.module';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

describe('AccountController (e2e)', () => {
  let app: INestApplication<App>;
  let db: InMemoryDatabase;
  let userRepository: UserRepositoryMemory;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    db = InMemoryDatabase.getInstance();
    db.reset();
    userRepository = app.get<UserRepositoryMemory>(USER_REPOSITORY);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/account/user (POST)', () => {
    it('should register a user', async () => {
      const input: RegisterUserInputDto = {
        firstName: 'joao',
        lastName: 'silva',
        password: 'Password@123',
        phone: '95991724765',
        email: 'test@email.com',
        cpf: Cpf.VALID_CPF,
      };
      return request(app.getHttpServer())
        .post('/account/user')
        .send(input)
        .expect(201)
        .expect(async (res) => {
          const user = await userRepository.findByEmail(input.email);
          expect(user).toBeDefined();
          expect(user!.firstName).toBe(input.firstName);
          expect(user!.lastName).toBe(input.lastName);
          expect(user!.email).toBe(input.email);
          expect(user!.cpf).toBe(input.cpf);
          const { accessToken, refreshToken } = res.body;
          expect(refreshToken).toBeDefined();
          expect(accessToken).toBeDefined();
        });
    });
  });

  describe('Profile Management', () => {
    let accessToken: string;
    const testUser: RegisterUserInputDto = {
      firstName: 'Profile',
      lastName: 'User',
      password: 'Password@123',
      phone: '11987654321',
      email: 'profile-user@test.com',
      cpf: Cpf.VALID_CPF,
    };

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/account/user').send(testUser);
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      accessToken = loginResponse.body.accessToken;
    });

    it('/account/profile (PATCH) should update user profile', async () => {
      const updatePayload = {
        firstName: 'UpdatedFirstName',
        phone: '11999999999',
      };

      await request(app.getHttpServer())
        .patch('/account/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(204);

      const updatedUser = await userRepository.findByEmail(testUser.email);
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.firstName).toBe(updatePayload.firstName);
      expect(updatedUser!.phone).toBe(updatePayload.phone);
      expect(updatedUser!.lastName).toBe(testUser.lastName);
    });

    it('/account/change-password (POST) should change user password', async () => {
      const changePasswordPayload = {
        oldPassword: 'Password@123',
        newPassword: 'NewPassword@456',
      };

      await request(app.getHttpServer())
        .post('/account/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordPayload)
        .expect(204);

      const loginAttempt = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'NewPassword@456' });

      expect(loginAttempt.status).toBe(200);
      expect(loginAttempt.body.accessToken).toBeDefined();
    });

    it('/account/change-password (POST) should fail with wrong old password', async () => {
      const changePasswordPayload = {
        oldPassword: 'WrongOldPassword',
        newPassword: 'NewPassword@456',
      };

      await request(app.getHttpServer())
        .post('/account/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordPayload)
        .expect(500);
    });
  });
});