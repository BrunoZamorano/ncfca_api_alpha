import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import AccountModule from '../src/shared/modules/account.module';
import { RegisterUserInputDto } from '../src/infraestructure/dtos/register-user.dto';

describe('AccountController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AccountModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/account/user (POST)', () => {
    const input: RegisterUserInputDto = {
      firstName: 'joao',
      lastName: 'silva',
      password: '123123',
      email: 'test@email.com',
    };
    return request(app.getHttpServer()).post('/account/user').send(input).expect(201).expect(res => {
      expect(res.body.firstName).toBe(input.firstName);
    });
  });
});
