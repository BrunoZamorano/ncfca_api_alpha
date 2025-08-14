import * as request from 'supertest';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';
import { AppModule } from '@/app.module';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';
import { RegisterUserInputDto } from '@/infraestructure/dtos/register-user.dto';
import Cpf from '@/domain/value-objects/cpf/cpf';
import { CreateClubInputDto } from '@/infraestructure/dtos/create-club.dto';
import { UserRoles } from '@/domain/enums/user-roles';
import { USER_REPOSITORY } from '@/shared/constants/repository-constants';
import UserRepository from '@/domain/repositories/user-repository';
import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
import { CLUB_REPOSITORY } from '@/shared/constants/repository-constants';
import { NestExpressApplication } from '@nestjs/platform-express';

describe('ClubController (e2e)', () => {
  let app: NestExpressApplication;
  let db: InMemoryDatabase;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.set('query parser', 'extended');
    await app.init();
    db = InMemoryDatabase.getInstance();
    db.reset();
    userRepository = app.get<UserRepository>(USER_REPOSITORY);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/club (POST)', () => {
    let accessToken: string;
    const testUser: RegisterUserInputDto = {
      firstName: 'Club',
      lastName: 'Owner',
      password: 'Password@123',
      email: 'club-owner@test.com',
      cpf: Cpf.VALID_CPF,
      phone: '11122233344',
    };
    const createClubDto: CreateClubInputDto = {
      name: 'Orators Debate Club',
      city: 'Metropolis',
    };

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/account/user').send(testUser);
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({ email: testUser.email, password: testUser.password });
      accessToken = loginResponse.body.accessToken;
      await request(app.getHttpServer()).post('/checkout').send({ token: 'valid-token' });
    });

    it('Deve criar um clube com sucesso para um usuário autenticado', async () => {
      const response = await request(app.getHttpServer())
        .post('/club')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createClubDto)
        .expect(HttpStatus.CREATED);
      expect(response.body.name).toBe(createClubDto.name);
      expect(response.body.city).toBe(createClubDto.city);
      expect(response.body.id).toBeDefined();
      const owner = await userRepository.findByEmail(testUser.email);
      expect(owner?.roles).toContain(UserRoles.DONO_DE_CLUBE);
    });

    it('NÃO deve permitir que um usuário crie um segundo clube', async () => {
      await request(app.getHttpServer()).post('/club').set('Authorization', `Bearer ${accessToken}`).send(createClubDto);
      await request(app.getHttpServer())
        .post('/club')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Another Club', city: 'Gotham' })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toBe('User can only own one club.');
        });
    });

    it('deve retornar 401 Unauthorized se o usuário não estiver autenticado', async () => {
      await request(app.getHttpServer()).post('/club').send(createClubDto).expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/club (GET)', function () {
    let accessToken: string;

    beforeEach(async () => {
      const user: RegisterUserInputDto = {
        firstName: 'Get',
        lastName: 'User',
        password: 'Password@123',
        email: 'get-user@test.com',
        cpf: Cpf.VALID_CPF,
        phone: '55566677788',
      };
      await request(app.getHttpServer()).post('/account/user').send(user);
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({ email: user.email, password: user.password });
      accessToken = loginResponse.body.accessToken;
      const clubRepository = app.get<ClubRepositoryMemory>(CLUB_REPOSITORY);
      db.clubs.push(...clubRepository.populate(250));
    });

    it('deve retornar uma lista paginada de clubes', async () => {
      return request(app.getHttpServer())
        .get('/club?pagination[page]=1&pagination[limit]=100')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const { meta, data } = res.body;
          expect(meta.totalPages).toBe(3);
          expect(data.length).toBe(100);
          expect(meta.limit).toBe(100);
          expect(meta.total).toBe(250);
          expect(meta.page).toBe(1);
        });
    });
  });
});
