import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import AllExceptionsFilter from '@/infraestructure/filters/global-exception-filter';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { createTestUser } from '../utils/prisma/create-test-user';
import { surgicalCleanup } from '../utils/prisma/cleanup';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { FamilyStatus } from '@/domain/enums/family-status';
import { PaymentStatus } from '@/domain/enums/payment-status';
import { UserRoles } from '@/domain/enums/user-roles';
import { randomUUID } from 'crypto';
import { PaymentTransaction } from '@/domain/types/payment';

describe('E2E CheckoutUseCase', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const createdUsers: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, createdUsers);
    await app.close();
  });

  it('Deve processar pagamento de afiliação com cartão de crédito e ativar família', async () => {
    // Arrange
    const { userId, accessToken } = await createTestUser(`test-${randomUUID()}@example.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    createdUsers.push(userId);

    // Act
    const response: { body: { id: string; status: PaymentStatus }; status: number } = await request(app.getHttpServer())
      .post('/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentToken: 'valid-token', // Token válido para sucesso no mock
        installments: 1,
      });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe(PaymentStatus.PAID);

    const family = await prisma.family.findUnique({ where: { holder_id: userId } });
    expect(family?.status).toBe(FamilyStatus.AFFILIATED);
  });

  it('Deve processar pagamento de afiliação com PIX e manter família como não afiliada', async () => {
    // Arrange
    const { userId, accessToken } = await createTestUser(`test-${randomUUID()}@example.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    createdUsers.push(userId);

    // Act
    const response: request.Response = await request(app.getHttpServer()).post('/checkout').set('Authorization', `Bearer ${accessToken}`).send({
      paymentMethod: PaymentMethod.PIX,
    });
    const body = response.body as PaymentTransaction;
    const status = response.status;

    // Assert
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
    expect(body.status).toBe(PaymentStatus.PENDING);

    const family = await prisma.family.findUnique({ where: { holder_id: userId } });
    expect(family?.status).toBe(FamilyStatus.NOT_AFFILIATED);
  });

  it('Não deve processar pagamento com token de autorização inválido', async () => {
    // Arrange
    const invalidToken = 'invalid-jwt-token';

    // Act
    const response = await request(app.getHttpServer()).post('/checkout').set('Authorization', `Bearer ${invalidToken}`).send({
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentToken: 'tok_visa',
      installments: 1,
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('Não deve processar pagamento se a família já estiver afiliada', async () => {
    // Arrange
    const { userId, accessToken } = await createTestUser(`test-${randomUUID()}@example.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    createdUsers.push(userId);
    await prisma.family.update({
      where: { holder_id: userId },
      data: { status: FamilyStatus.AFFILIATED },
    });

    // Act
    const response = await request(app.getHttpServer()).post('/checkout').set('Authorization', `Bearer ${accessToken}`).send({
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentToken: 'valid-token',
      installments: 1,
    });
    const body = response.body as { message: string };

    // Assert
    expect(response.status).toBe(400);
    expect(body.message).toBe('FAMILY_ALREADY_AFFILIATED');
  });

  it('Não deve processar pagamento com cartão de crédito sem paymentToken', async () => {
    // Arrange
    const { userId, accessToken } = await createTestUser(`test-${randomUUID()}@example.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    createdUsers.push(userId);

    // Act
    const response = await request(app.getHttpServer()).post('/checkout').set('Authorization', `Bearer ${accessToken}`).send({
      paymentMethod: PaymentMethod.CREDIT_CARD,
      installments: 1,
    });
    const body = response.body as { message: string };

    // Assert
    expect(response.status).toBe(400);
    expect(body.message).toContain('O token de pagamento é obrigatório para cartão de crédito.');
  });

  it('Não deve processar pagamento se o processamento do cartão de crédito falhar', async () => {
    // Arrange
    const { userId, accessToken } = await createTestUser(`test-${randomUUID()}@example.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    createdUsers.push(userId);
    // Mock Stripe to simulate failure - this would typically be done at a lower level (e.g., PaymentGateway mock)
    // For E2E, we rely on Stripe's test tokens for specific scenarios.
    // Using a known failing test token for Stripe
    const failingToken = 'invalid-token';

    // Act
    const response = await request(app.getHttpServer()).post('/checkout').set('Authorization', `Bearer ${accessToken}`).send({
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentToken: failingToken,
      installments: 1,
    });
    const body = response.body as { message: string };

    // Assert
    expect(response.status).toBe(400);
    expect(body.message).toContain('PAYMENT_FAILED');
  });
});
