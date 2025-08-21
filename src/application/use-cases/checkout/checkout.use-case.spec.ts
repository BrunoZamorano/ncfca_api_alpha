import { Test, TestingModule } from '@nestjs/testing';
import Checkout from './checkout.use-case';
import { FAMILY_REPOSITORY, TRANSACTION_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR, PAYMENT_GATEWAY } from '@/shared/constants/service-constants';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { DomainException, EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { FamilyStatus } from '@/domain/enums/family-status';
import { PaymentTransaction } from '@/domain/types/payment';
import User from '@/domain/entities/user/user';
import Family from '@/domain/entities/family/family';
import Transaction from '@/domain/entities/transaction/transaction';
import Address from '@/domain/value-objects/address/address';
import Cpf from '@/domain/value-objects/cpf/cpf';
import Email from '@/domain/value-objects/email/email';
import { UserRoles } from '@/domain/enums/user-roles';
import Password from '@/domain/value-objects/password/password';
import HashingService from '@/domain/services/hashing-service';
import { PaymentStatus } from '@/domain/enums/payment-status';

describe('UNIT Checkout', () => {
  let checkoutUseCase: Checkout;
  let mockTransactionRepository;
  let mockFamilyRepository;
  let mockUserRepository;
  let mockPaymentGateway;
  let mockIdGenerator;

  const mockHashingService: HashingService = {
    hash: jest.fn((value) => `hashed_${value}`),
    compare: jest.fn((plain, hashed) => hashed === `hashed_${plain}`),
  };

  const mockUser = new User({
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: new Email('john.doe@example.com'),
    password: Password.create('ValidPassword123', mockHashingService),
    phone: '123456789',
    cpf: new Cpf(Cpf.VALID_CPF),
    rg: '12345678',
    roles: [UserRoles.SEM_FUNCAO],
    address: new Address({
      city: 'Anytown',
      state: 'AS',
      number: '123',
      street: 'Main St',
      zipCode: '12345-678',
      district: 'Downtown',
      complement: 'Apt 1',
    }),
  });

  let mockFamily = new Family({
    id: 'family-1',
    holderId: mockUser.id,
    status: FamilyStatus.PENDING_PAYMENT,
  });

  const mockPaymentTransaction: PaymentTransaction = {
    id: 'gateway-trans-1',
    status: PaymentStatus.PENDING,
    amount: 50000,
    metadata: { some: 'data' },
    paymentUrl: 'http://payment.url',
    qrCode: 'qr-code-data',
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockTransactionRepository = { save: jest.fn() };
    mockFamilyRepository = { findByHolderId: jest.fn(), save: jest.fn() };
    mockUserRepository = { find: jest.fn() };
    mockPaymentGateway = {
      createTransaction: jest.fn(),
      processCreditCardPayment: jest.fn(),
      name: 'MockGateway',
    };
    mockIdGenerator = { generate: jest.fn(() => 'generated-id') };

    // Re-create mockFamily to ensure fresh state for each test
    mockFamily = new Family({
      id: 'family-1',
      holderId: mockUser.id,
      status: FamilyStatus.PENDING_PAYMENT,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Checkout,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTransactionRepository },
        { provide: FAMILY_REPOSITORY, useValue: mockFamilyRepository },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: PAYMENT_GATEWAY, useValue: mockPaymentGateway },
        { provide: ID_GENERATOR, useValue: mockIdGenerator },
      ],
    }).compile();

    checkoutUseCase = module.get<Checkout>(Checkout);
    jest.clearAllMocks();
  });

  it('Deve processar o checkout com sucesso para cartão de crédito', async () => {
    // Arrange
    mockUserRepository.find.mockResolvedValue(mockUser);
    mockFamilyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockPaymentGateway.createTransaction.mockResolvedValue(mockPaymentTransaction);
    mockPaymentGateway.processCreditCardPayment.mockResolvedValue({ success: true });

    const input = {
      userId: mockUser.id,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentToken: 'card-token',
      installments: 1,
    };

    // Act
    const result = await checkoutUseCase.execute(input);

    // Assert
    expect(mockUserRepository.find).toHaveBeenCalledWith(input.userId);
    expect(mockFamilyRepository.findByHolderId).toHaveBeenCalledWith(input.userId);
    expect(mockPaymentGateway.createTransaction).toHaveBeenCalledWith(
      input.paymentMethod,
      [{ quantity: 1, price_cents: 50000, description: 'Taxa de Afiliação NCFCA Brasil' }],
      expect.any(Object), // PaymentPayer
    );
    expect(mockPaymentGateway.processCreditCardPayment).toHaveBeenCalledWith(mockPaymentTransaction.id, {
      installments: input.installments,
      token: input.paymentToken,
    });
    expect(mockFamily.status).toBe(FamilyStatus.AFFILIATED);
    expect(mockFamilyRepository.save).toHaveBeenCalledWith(mockFamily);
    expect(mockTransactionRepository.save).toHaveBeenCalledWith(expect.any(Transaction));
    expect(result).toEqual(mockPaymentTransaction);
  });

  it('Deve processar o checkout com sucesso para PIX', async () => {
    // Arrange
    mockUserRepository.find.mockResolvedValue(mockUser);
    mockFamilyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockPaymentGateway.createTransaction.mockResolvedValue(mockPaymentTransaction);

    const input = {
      userId: mockUser.id,
      paymentMethod: PaymentMethod.PIX,
    };

    // Act
    const result = await checkoutUseCase.execute(input);

    // Assert
    expect(mockUserRepository.find).toHaveBeenCalledWith(input.userId);
    expect(mockFamilyRepository.findByHolderId).toHaveBeenCalledWith(input.userId);
    expect(mockPaymentGateway.createTransaction).toHaveBeenCalledWith(
      input.paymentMethod,
      [{ quantity: 1, price_cents: 50000, description: 'Taxa de Afiliação NCFCA Brasil' }],
      expect.any(Object), // PaymentPayer
    );
    expect(mockPaymentGateway.processCreditCardPayment).not.toHaveBeenCalled();
    expect(mockFamily.status).toBe(FamilyStatus.PENDING_PAYMENT); // PIX doesn't activate immediately
    expect(mockFamilyRepository.save).not.toHaveBeenCalled(); // Family status not changed by PIX
    expect(mockTransactionRepository.save).toHaveBeenCalledWith(expect.any(Transaction));
    expect(result).toEqual(mockPaymentTransaction);
  });

  it('Não deve fazer checkout se o usuário não for encontrado', async () => {
    // Arrange
    mockUserRepository.find.mockResolvedValue(null);
    const input = { userId: 'non-existent-user', paymentMethod: PaymentMethod.CREDIT_CARD };

    // Act & Assert
    await expect(checkoutUseCase.execute(input)).rejects.toThrow(new EntityNotFoundException('User', input.userId));
    expect(mockFamilyRepository.findByHolderId).not.toHaveBeenCalled();
    expect(mockPaymentGateway.createTransaction).not.toHaveBeenCalled();
    expect(mockTransactionRepository.save).not.toHaveBeenCalled();
  });

  it('Não deve fazer checkout se a família não for encontrada', async () => {
    // Arrange
    mockUserRepository.find.mockResolvedValue(mockUser);
    mockFamilyRepository.findByHolderId.mockResolvedValue(null);
    const input = { userId: mockUser.id, paymentMethod: PaymentMethod.CREDIT_CARD };

    // Act & Assert
    await expect(checkoutUseCase.execute(input)).rejects.toThrow(new EntityNotFoundException('Family', `for user ${mockUser.id}`));
    expect(mockPaymentGateway.createTransaction).not.toHaveBeenCalled();
    expect(mockTransactionRepository.save).not.toHaveBeenCalled();
  });

  it('Não deve fazer checkout se a família já estiver afiliada', async () => {
    // Arrange
    mockUserRepository.find.mockResolvedValue(mockUser);
    mockFamilyRepository.findByHolderId.mockResolvedValue(
      new Family({
        id: mockFamily.id,
        holderId: mockFamily.holderId,
        status: FamilyStatus.AFFILIATED,
        dependants: mockFamily.dependants,
        affiliatedAt: mockFamily.affiliatedAt,
        affiliationExpiresAt: mockFamily.affiliationExpiresAt,
      }),
    );
    const input = { userId: mockUser.id, paymentMethod: PaymentMethod.CREDIT_CARD };

    // Act & Assert
    await expect(checkoutUseCase.execute(input)).rejects.toThrow(new DomainException('FAMILY_ALREADY_AFFILIATED'));
    expect(mockPaymentGateway.createTransaction).not.toHaveBeenCalled();
    expect(mockTransactionRepository.save).not.toHaveBeenCalled();
  });

  it('Não deve fazer checkout com cartão de crédito sem paymentToken', async () => {
    // Arrange
    mockUserRepository.find.mockResolvedValue(mockUser);
    mockFamilyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockPaymentGateway.createTransaction.mockResolvedValue(mockPaymentTransaction);

    const input = {
      userId: mockUser.id,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      installments: 1,
    };

    // Act & Assert
    await expect(checkoutUseCase.execute(input)).rejects.toThrow(new DomainException('Payment token is required for credit card payments.'));
    expect(mockPaymentGateway.processCreditCardPayment).not.toHaveBeenCalled();
    expect(mockTransactionRepository.save).not.toHaveBeenCalled();
  });

  it('Não deve fazer checkout se o processamento do cartão de crédito falhar', async () => {
    // Arrange
    mockUserRepository.find.mockResolvedValue(mockUser);
    mockFamilyRepository.findByHolderId.mockResolvedValue(mockFamily);
    mockPaymentGateway.createTransaction.mockResolvedValue(mockPaymentTransaction);
    mockPaymentGateway.processCreditCardPayment.mockResolvedValue({ success: false, message: 'Payment failed' });

    const input = {
      userId: mockUser.id,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentToken: 'card-token',
      installments: 1,
    };

    // Act & Assert
    await expect(checkoutUseCase.execute(input)).rejects.toThrow(new DomainException('PAYMENT_FAILED: Payment failed'));
    expect(mockFamilyRepository.save).not.toHaveBeenCalled();
    expect(mockTransactionRepository.save).not.toHaveBeenCalled();
  });
});
