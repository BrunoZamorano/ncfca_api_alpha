import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';
import Cpf from '@/domain/value-objects/cpf/cpf';
import Club from '@/domain/entities/club/club';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';
import { AddDependantDto } from '@/infraestructure/dtos/add-dependant.dto';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';
import DependantDto from '@/domain/dtos/dependant.dto';
import { CheckoutInputDto } from '@/infraestructure/dtos/checkout.dto';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { FamilyStatus } from '@/domain/enums/family-status';

describe('Enrollment Journey (e2e)', () => {
  let app: INestApplication;
  let db: InMemoryDatabase;
  let accessToken: string;
  let clubId: string;
  let familyId: string;

  const testUser = {
    firstName: 'Holder',
    lastName: 'E2E',
    password: 'Password@123',
    email: 'journey-e2e@example.com',
    cpf: Cpf.VALID_CPF,
    phone: '12345678',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    db = InMemoryDatabase.getInstance();
    db.reset();

    const regResponse = await request(app.getHttpServer()).post('/account/user').send(testUser);
    accessToken = regResponse.body.accessToken;

    const club = new Club({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      principalId: 'owner',
      name: 'E2E Debate Club',
    });
    db.clubs.push(club);
    clubId = club.id;

    const holder = db.users.find((u) => u.email === testUser.email)!;
    const family = db.families.find((f) => f.holderId === holder.id)!;
    familyId = family.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('deve permitir a um usuário pagar a afiliação, adicionar um dependente e solicitar a matrícula', async () => {
    const checkoutDto: CheckoutInputDto = {
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentToken: 'valid-token',
    };
    await request(app.getHttpServer())
      .post('/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(checkoutDto)
      .expect(HttpStatus.OK);

    const affiliatedFamily = db.families.find((f) => f.id === familyId)!;
    expect(affiliatedFamily.status).toBe(FamilyStatus.AFFILIATED);

    const addDependantDto: AddDependantDto = {
      firstName: 'Test',
      lastName: 'Child',
      birthdate: '2010-01-01',
      relationship: DependantRelationship.SON,
      sex: Sex.MALE,
    };
    const dependantResponse = await request(app.getHttpServer())
      .post('/dependants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(addDependantDto)
      .expect(HttpStatus.CREATED);
    const createdDependant: DependantDto = dependantResponse.body;
    expect(createdDependant.id).toBeDefined();

    const enrollmentDto = { dependantId: createdDependant.id, clubId };
    await request(app.getHttpServer())
      .post('/enrollments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(enrollmentDto)
      .expect(HttpStatus.CREATED);

    expect(db.enrollmentRequests).toHaveLength(1);
    const requestInDb = db.enrollmentRequests[0];
    expect(requestInDb.status).toBe(EnrollmentStatus.PENDING);
    expect(requestInDb.dependantId).toBe(createdDependant.id);
    expect(requestInDb.clubId).toBe(clubId);
  });
});
