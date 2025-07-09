import { Test, TestingModule } from '@nestjs/testing';

import Family from '@/domain/entities/family/family';
import Transaction from '@/domain/entities/transaction/transaction';
import { FamilyStatus } from '@/domain/enums/family-status';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { PaymentStatus } from '@/domain/enums/payment-status';
import { WebhookPayload } from '@/domain/types/payment';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

import InMemoryDatabase from '@/infraestructure/database/in-memory.database';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
import { UnitOfWorkMemory } from '@/infraestructure/services/unit-of-work.memory';
import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import TransactionRepositoryMemory from '@/infraestructure/repositories/transaction.memory-repository';

import {
  USER_REPOSITORY,
  FAMILY_REPOSITORY,
  TRANSACTION_REPOSITORY,
  CLUB_REPOSITORY,
} from '@/shared/constants/repository-constants';

import ProcessPaymentUpdate from './process-payment-update';
import { ENROLLMENT_REQUEST_REPOSITORY } from '@/domain/repositories/enrollment-request-repository';
import EnrollmentRequestRepositoryMemory from '@/infraestructure/repositories/enrollment-request.repository.memory'; // Testando a versão corrigida

describe('ProcessPaymentUpdate Use Case (Integration)', () => {
  let useCase: ProcessPaymentUpdate;
  let db: InMemoryDatabase;

  const familyId = 'family-1';
  const transactionId = 'tx-1';
  const gatewayTransactionId = 'gateway-tx-1';

  beforeEach(async () => {
    db = InMemoryDatabase.getInstance();
    db.reset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentUpdate,
        { provide: UNIT_OF_WORK, useClass: UnitOfWorkMemory },
        { provide: USER_REPOSITORY, useClass: UserRepositoryMemory },
        { provide: FAMILY_REPOSITORY, useFactory: () => new FamilyRepositoryMemory([]) },
        { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepositoryMemory },
        { provide: ENROLLMENT_REQUEST_REPOSITORY, useClass: EnrollmentRequestRepositoryMemory },
        { provide: CLUB_REPOSITORY, useFactory: () => new ClubRepositoryMemory({ clubs: [] }) },
      ],
    }).compile();
    useCase = module.get<ProcessPaymentUpdate>(ProcessPaymentUpdate);
  });

  const seedDb = (familyStatus: FamilyStatus = FamilyStatus.NOT_AFFILIATED) => {
    db.families.push(new Family({ id: familyId, holderId: 'user-1', status: familyStatus }));
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
  };

  const paidWebhookPayload: WebhookPayload = {
    event: 'PAYMENT_CONFIRMED',
    data: { id: gatewayTransactionId, status: PaymentStatus.PAID },
    timestamp: new Date().toISOString(),
  };

  it('Deve atualizar a transação para PAID e ativar a família com sucesso', async () => {
    seedDb();
    await useCase.execute(paidWebhookPayload);
    const updatedTransaction = db.transactions.find((t) => t.id === transactionId);
    const updatedFamily = db.families.find((f) => f.id === familyId);
    expect(updatedTransaction?.status).toBe(PaymentStatus.PAID);
    expect(updatedFamily?.status).toBe(FamilyStatus.AFFILIATED);
  });

  it('Deve ser idempotente e não alterar o status da família se a transação já estiver como PAID', async () => {
    seedDb(FamilyStatus.NOT_AFFILIATED);
    db.transactions[0].changeStatus(PaymentStatus.PAID);
    await useCase.execute(paidWebhookPayload);
    const family = db.families.find((f) => f.id === familyId);
    expect(family?.status).toBe(FamilyStatus.NOT_AFFILIATED);
  });

  it('Deve lançar uma exceção e reverter a transação se a família não for encontrada', async () => {
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
    await expect(useCase.execute(paidWebhookPayload)).rejects.toThrow(EntityNotFoundException);
    const transactionAfterError = db.transactions.find((t) => t.id === transactionId);
    expect(transactionAfterError?.status).toBe(PaymentStatus.PENDING);
  });

  it('Deve apenas atualizar o status da transação se o pagamento falhar', async () => {
    seedDb();
    const failedPayload: WebhookPayload = {
      ...paidWebhookPayload,
      data: { ...paidWebhookPayload.data, status: PaymentStatus.FAILED },
    };
    await useCase.execute(failedPayload);
    const updatedTransaction = db.transactions.find((t) => t.id === transactionId);
    const family = db.families.find((f) => f.id === familyId);
    expect(updatedTransaction?.status).toBe(PaymentStatus.FAILED);
    expect(family?.status).toBe(FamilyStatus.NOT_AFFILIATED);
  });
});
