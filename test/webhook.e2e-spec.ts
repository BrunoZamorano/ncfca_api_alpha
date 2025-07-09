import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { WebhookPayload } from '@/domain/types/payment';
import { PaymentStatus } from '@/domain/enums/payment-status';
import { FamilyStatus } from '@/domain/enums/family-status';
import Transaction from '@/domain/entities/transaction/transaction';
import Family from '@/domain/entities/family/family';

import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

import { AppModule } from '@/app.module';

describe('WebhookController (e2e)', () => {
  let app: INestApplication;
  let db: InMemoryDatabase;
  const familyId = 'e2e-family-1';
  const transactionId = 'e2e-tx-1';
  const gatewayTransactionId = 'e2e-gateway-tx-1';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
    db = InMemoryDatabase.getInstance();
    db.reset();
  });

  afterEach(async () => {
    await app.close();
  });

  it('deve receber um webhook de pagamento bem-sucedido, atualizar o status da transação para PAID e da família para AFFILIATED', async () => {
    db.families.push(new Family({ id: familyId, holderId: 'user-1', status: FamilyStatus.NOT_AFFILIATED }));
    db.transactions.push(
      Transaction.create({
        id: transactionId,
        familyId,
        gatewayTransactionId,
        status: PaymentStatus.PENDING,
        amountCents: 50000,
        gateway: 'memory',
        gatewayPayload: {},
        paymentMethod: 'pix',
      }),
    );
    const payload: WebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      data: { id: gatewayTransactionId, status: PaymentStatus.PAID },
      timestamp: new Date().toISOString(),
    };
    await request(app.getHttpServer()).post('/webhook/payment-updates').send(payload).expect(HttpStatus.NO_CONTENT);
    const updatedTransaction = db.transactions.find((t) => t.id === transactionId);
    const updatedFamily = db.families.find((f) => f.id === familyId);
    expect(updatedTransaction).toBeDefined();
    expect(updatedTransaction?.status).toBe(PaymentStatus.PAID);
    expect(updatedFamily).toBeDefined();
    expect(updatedFamily?.status).toBe(FamilyStatus.AFFILIATED);
  });
});
