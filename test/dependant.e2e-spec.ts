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
import Family from '@/domain/entities/family/family';
import Dependant from '@/domain/entities/dependant/dependant';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import { UpdateDependantDto } from '@/infraestructure/dtos/update-dependant.dto';
import { CpfGenerator } from '@/infraestructure/services/cpf-generator.service';
import { FamilyDto } from '@/domain/dtos/family.dto';
import FamilyRepository from '@/domain/repositories/family-repository';
import { FAMILY_REPOSITORY } from '@/shared/constants/repository-constants';
import User, { CreateUserProps } from '@/domain/entities/user/user';
import { RegisterUserInputDto } from '@/infraestructure/dtos/register-user.dto';
import Address from '@/domain/value-objects/address/address';

describe('DependantController (e2e)', () => {
  let app: INestApplication;
  let familyId: string;
  let familyRepo: FamilyRepository;
  let accessToken: string;

  beforeEach(async () => {
    const cpfGenerator = new CpfGenerator();
    const testUser: RegisterUserInputDto = {
      firstName: 'Holder',
      lastName: 'Test',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      phone: '11999998888',
      email: `${crypto.randomUUID()}holder-test@example.com`,
      cpf: cpfGenerator.gerarCpf(),
      address: {
        district: 'Test District',
        zipCode: '12345678',
        city: 'Test City',
        state: 'RR',
        street: 'Test Street',
        number: '123',
        complement: 'Apt 456',
      },
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    familyRepo = app.get<FamilyRepository>(FAMILY_REPOSITORY);
    const registrationResponse = await request(app.getHttpServer()).post('/account/user').send(testUser);
    accessToken = registrationResponse.body.accessToken;
    const myFamilyResponse = await request(app.getHttpServer()).get('/dependants/my-family').set('Authorization', `Bearer ${accessToken}`);
    const myFamily: FamilyDto = myFamilyResponse.body;
    familyId = myFamily.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/dependants (POST)', () => {
    const validDependantDto: AddDependantDto = {
      firstName: 'John',
      lastName: 'Doe',
      birthdate: '2010-01-01',
      relationship: DependantRelationship.SON,
      sex: Sex.MALE,
      email: 'john.doe.jr@example.com',
    };

    it('deve adicionar um dependente com sucesso para um usuário autenticado', async () => {
      const family = await familyRepo.find(familyId);
      if (!family) throw new Error('Family not found');
      family.activateAffiliation();
      await familyRepo.save(family);
      await request(app.getHttpServer())
        .post('/dependants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDependantDto)
        .expect(HttpStatus.CREATED);
      const updatedFamily = await familyRepo.find(familyId);
      expect(updatedFamily?.dependants).toHaveLength(1);
      const dependant = updatedFamily?.dependants[0];
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
