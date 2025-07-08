import * as request from 'supertest';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

import Cpf from '@/domain/value-objects/cpf/cpf';

import { RegisterUserInputDto } from '@/infraestructure/dtos/register-user.dto';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';

import { USER_REPOSITORY } from '@/shared/constants/repository-constants';

import { AppModule } from '@/app.module';
import User from '@/domain/entities/user/user';

describe('AccountController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/account/user (POST)', async function () {
    const input: RegisterUserInputDto = {
      firstName: 'joao',
      lastName: 'silva',
      password: User.DEFAULT_PASSWORD,
      phone: User.DEFAULT_PHONE,
      email: 'test@email.com',
      cpf: Cpf.VALID_CPF,
    };
    const userRepository = app.get<UserRepositoryMemory>(USER_REPOSITORY);
    return request(app.getHttpServer())
      .post('/account/user')
      .send(input)
      .expect(201)
      .expect(async (res) => {
        const user = await userRepository.findByEmail(input.email);
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
