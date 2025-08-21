import * as request from 'supertest';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { WebhookPayload } from '@/domain/types/payment';
import { PaymentStatus } from '@/domain/enums/payment-status';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { TransactionContextType } from '@/domain/enums/transaction-context-type';
import { FamilyStatus } from '@/domain/enums/family-status';
import { UserRoles } from '@/domain/enums/user-roles';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { createTestUser } from './utils/prisma/create-test-user';
import { surgicalCleanup } from './utils/prisma/cleanup';

import { AppModule } from '@/app.module';

describe('WebhookController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: { userId: string; familyId: string; accessToken: string };
  const testUsers: string[] = [];
  const gatewayTransactionId = 'e2e-gateway-tx-1';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
    user = await createTestUser(`webhook-${crypto.randomUUID()}@test.com`, [UserRoles.SEM_FUNCAO], prisma, app);
    testUsers.push(user.userId);
  });

  afterAll(async () => {
    await surgicalCleanup(prisma, testUsers);
    await app.close();
  });

  it('deve receber um webhook de pagamento bem-sucedido, atualizar o status da transação para PAID e da família para AFFILIATED', async () => {
    const transaction = await prisma.transaction.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.userId,
        family_id: user.familyId,
        gateway_transaction_id: gatewayTransactionId,
        status: PaymentStatus.PENDING,
        amount_cents: 50000,
        gateway: 'memory',
        gateway_payload: {},
        payment_method: PaymentMethod.PIX,
        context_type: TransactionContextType.FAMILY_AFFILIATION,
      },
    });

    const payload: WebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      data: { id: gatewayTransactionId, status: PaymentStatus.PAID },
      timestamp: new Date().toISOString(),
    };

    await request(app.getHttpServer()).post('/webhook/payment-updates').send(payload).expect(HttpStatus.NO_CONTENT);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
    });
    const updatedFamily = await prisma.family.findUnique({
      where: { id: user.familyId },
    });

    expect(updatedTransaction).toBeDefined();
    expect(updatedTransaction?.status).toBe(PaymentStatus.PAID);
    expect(updatedFamily).toBeDefined();
    expect(updatedFamily?.status).toBe(FamilyStatus.AFFILIATED);
  });
});
