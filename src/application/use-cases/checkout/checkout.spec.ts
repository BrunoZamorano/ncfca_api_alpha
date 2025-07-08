import { Test } from '@nestjs/testing';
import Checkout from './checkout';
import UserRepository from '@/domain/repositories/user-repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import { USER_REPOSITORY, FAMILY_REPOSITORY, TRANSACTION_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, ID_GENERATOR, PAYMENT_GATEWAY } from '@/shared/constants/service-constants';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import UuidGenerator from '@/infraestructure/services/uuid-generator';
import UserFactory from '@/domain/factories/user.factory';
import AnemicHashingService from '@/infraestructure/services/anemic-hashing-service';
import Family from '@/domain/entities/family/family';
import { DomainException, EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { FamilyStatus } from '@/domain/enums/family-status';
import User from '@/domain/entities/user/user';
import { PaymentGateway } from '@/application/services/payment-gateway';
import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import { PaymentTransaction } from '@/domain/types/payment';
import { PaymentStatus } from '@/domain/enums/payment-status';
import TransactionRepositoryMemory from '@/infraestructure/repositories/transaction.memory-repository';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { USER_FACTORY } from '@/shared/constants/factories-constants';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

describe('Checkout', () => {
  const db = InMemoryDatabase.getInstance();
  let checkout: Checkout;
  let userRepository: UserRepository;
  let familyRepository: FamilyRepository;
  let transactionRepository: TransactionRepository;
  let paymentGateway: jest.Mocked<PaymentGateway>;
  let userFactory: UserFactory;

  const mockUserProps = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    password: User.DEFAULT_PASSWORD,
    address: {
      street: 'Rua Teste',
      number: '123',
      district: 'Bairro Teste',
      city: 'Cidade Teste',
      state: 'TS',
      zipCode: '12345-678',
    },
  };

  beforeEach(async () => {
    db.beginTransaction();
    const mockPaymentGatewayProvider = {
      provide: PAYMENT_GATEWAY,
      useValue: {
        name: 'MockGateway',
        createTransaction: jest.fn(),
        processCreditCardPayment: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        Checkout,
        { provide: USER_REPOSITORY, useClass: UserRepositoryMemory },
        { provide: FAMILY_REPOSITORY, useFactory: () => new FamilyRepositoryMemory() },
        { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepositoryMemory },
        { provide: HASHING_SERVICE, useClass: AnemicHashingService },
        { provide: ID_GENERATOR, useClass: UuidGenerator },
        mockPaymentGatewayProvider,
        { provide: USER_FACTORY, useClass: UserFactory },
        AnemicHashingService,
        UuidGenerator,
      ],
    }).compile();
    checkout = moduleRef.get<Checkout>(Checkout);
    userRepository = moduleRef.get<UserRepository>(USER_REPOSITORY);
    familyRepository = moduleRef.get<FamilyRepository>(FAMILY_REPOSITORY);
    transactionRepository = moduleRef.get<TransactionRepository>(TRANSACTION_REPOSITORY);
    paymentGateway = moduleRef.get(PAYMENT_GATEWAY);
    userFactory = moduleRef.get<UserFactory>(USER_FACTORY);
  });

  afterEach(() => {
    db.rollback();
  });

  it('deve realizar o checkout com PIX com sucesso', async () => {
    const user = userFactory.create(mockUserProps);
    await userRepository.save(user);
    const family = new Family({ id: 'family-1', holderId: user.id });
    await familyRepository.save(family);

    const gatewayResponse: PaymentTransaction = {
      id: 'gateway-trans-pix',
      status: PaymentStatus.PENDING,
      amount: 50000,
      paymentUrl: 'http://pagamento.com/pix',
      qrCode: 'pix-qr-code',
      qrCodeText: 'pix-copy-paste',
      metadata: { raw: 'data' },
      dueDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    paymentGateway.createTransaction.mockResolvedValue(gatewayResponse);
    const input = { userId: user.id, paymentMethod: PaymentMethod.PIX };
    const result = await checkout.execute(input);
    expect(result).toEqual(gatewayResponse);
    expect(paymentGateway.createTransaction).toHaveBeenCalledTimes(1);
    expect(paymentGateway.processCreditCardPayment).not.toHaveBeenCalled();
    const savedTransaction = await transactionRepository.findByGatewayTransactionId('gateway-trans-pix');
    expect(savedTransaction).toBeDefined();
    expect(savedTransaction?.familyId).toBe(family.id);
  });

  it('deve realizar o checkout com Cartão de Crédito e ativar a afiliação imediatamente', async () => {
    const user = userFactory.create(mockUserProps);
    await userRepository.save(user);
    const family = new Family({ id: 'family-1', holderId: user.id });
    await familyRepository.save(family);

    paymentGateway.createTransaction.mockResolvedValue({ id: 'gateway-trans-cc' } as PaymentTransaction);
    paymentGateway.processCreditCardPayment.mockResolvedValue({
      success: true,
      transactionId: 'gateway-trans-cc',
      message: 'Success',
      metadata: { raw: 'data' },
    });

    const input = {
      userId: user.id,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentToken: 'valid-token',
      installments: 1,
    };
    await checkout.execute(input);

    expect(paymentGateway.processCreditCardPayment).toHaveBeenCalledWith('gateway-trans-cc', {
      token: 'valid-token',
      installments: 1,
    });

    const updatedFamily = await familyRepository.find(family.id);
    expect(updatedFamily?.status).toBe(FamilyStatus.AFFILIATED);
  });

  it('deve lançar uma exceção se o usuário não for encontrado', async () => {
    const input = { userId: 'non-existent-user', paymentMethod: PaymentMethod.PIX };
    await expect(checkout.execute(input)).rejects.toThrow(EntityNotFoundException);
  });

  it('deve lançar uma exceção se a família do usuário não for encontrada', async () => {
    const user = userFactory.create(mockUserProps);
    await userRepository.save(user);
    const input = { userId: user.id, paymentMethod: PaymentMethod.PIX };
    await expect(checkout.execute(input)).rejects.toThrow(EntityNotFoundException);
  });

  it('deve lançar uma exceção se a família já estiver afiliada', async () => {
    const user = userFactory.create(mockUserProps);
    await userRepository.save(user);
    const family = new Family({ id: 'family-1', holderId: user.id, status: FamilyStatus.AFFILIATED });
    await familyRepository.save(family);
    const input = { userId: user.id, paymentMethod: PaymentMethod.PIX };
    await expect(checkout.execute(input)).rejects.toThrow(DomainException);
  });

  it('deve lançar uma exceção se o pagamento com cartão de crédito falhar', async () => {
    const user = userFactory.create(mockUserProps);
    await userRepository.save(user);
    const family = new Family({ id: 'family-1', holderId: user.id });
    await familyRepository.save(family);
    paymentGateway.createTransaction.mockResolvedValue({ id: 'gateway-trans-fail' } as PaymentTransaction);
    paymentGateway.processCreditCardPayment.mockResolvedValue({
      success: false,
      transactionId: 'gateway-trans-fail',
      message: 'Insufficient funds',
      metadata: { raw: 'data' },
    });
    const input = {
      userId: user.id,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentToken: 'invalid-token',
    };
    await expect(checkout.execute(input)).rejects.toThrow('PAYMENT_FAILED: Insufficient funds');
    const updatedFamily = await familyRepository.find(family.id);
    expect(updatedFamily?.status).toBe(FamilyStatus.NOT_AFFILIATED);
  });

  it('deve lançar uma exceção se o token de pagamento estiver faltando para cartão de crédito', async () => {
    const user = userFactory.create(mockUserProps);
    await userRepository.save(user);
    const family = new Family({ id: 'family-1', holderId: user.id });
    await familyRepository.save(family);
    paymentGateway.createTransaction.mockResolvedValue({ id: 'gateway-trans-no-token' } as PaymentTransaction);
    const input = { userId: user.id, paymentMethod: PaymentMethod.CREDIT_CARD };
    await expect(checkout.execute(input)).rejects.toThrow('Payment token is required for credit card payments.');
  });
});
