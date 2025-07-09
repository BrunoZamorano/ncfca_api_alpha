import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';
import Cpf from '@/domain/value-objects/cpf/cpf';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';
import { AddDependantDto } from '@/infraestructure/dtos/add-dependant.dto';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';

describe('DependantController (e2e)', () => {
  let app: INestApplication;
  let db: InMemoryDatabase;
  let accessToken: string;
  let familyId: string;

  const testUser = {
    firstName: 'Holder',
    lastName: 'Test',
    password: 'Password@123',
    phone: '11999998888',
    email: 'holder-test@example.com',
    cpf: Cpf.VALID_CPF,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    db = InMemoryDatabase.getInstance();
    db.reset();

    // Setup: Cria e loga um usuário para obter um token e popular o DB
    const registrationResponse = await request(app.getHttpServer()).post('/account/user').send(testUser);

    accessToken = registrationResponse.body.accessToken;

    const createdUser = db.users.find((u) => u.email === testUser.email);
    if (!createdUser) throw new Error('Test setup failed: User not found');
    const createdFamily = db.families.find((f) => f.holderId === createdUser.id);
    if (!createdFamily) throw new Error('Test setup failed: Family not found');
    createdFamily.activateAffiliation()
    familyId = createdFamily.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/dependants (POST)', () => {
    const validDependantDto: AddDependantDto = {
      firstName: 'John',
      lastName: 'Doe',
      birthdate: '2010-01-01',
      relationship: DependantRelationship.Son,
      sex: Sex.Male,
      email: 'john.doe.jr@example.com',
    };

    it('deve adicionar um dependente com sucesso para um usuário autenticado', async () => {
      // Act
      await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDependantDto)
        .expect(HttpStatus.CREATED);
      const family = db.families.find((f) => f.id === familyId);
      expect(family?.dependants).toHaveLength(1);
      const dependant = family?.dependants[0];
      expect(dependant?.firstName).toBe(validDependantDto.firstName);
      expect(dependant?.lastName).toBe(validDependantDto.lastName);
      expect(dependant?.email).toBe(validDependantDto.email);
    });

    it('deve retornar 401 Unauthorized se nenhum token for fornecido', () => {
      return request(app.getHttpServer()).post('/dependants').send(validDependantDto).expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 400 Bad Request se os dados do DTO forem inválidos', () => {
      const invalidDto = { ...validDependantDto, firstName: '' };

      return request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toContain('First name must be at least 2 characters long.');
        });
    });
  });
});
