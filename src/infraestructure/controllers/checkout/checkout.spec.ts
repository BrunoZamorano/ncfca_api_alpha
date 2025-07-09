import { Test, TestingModule } from '@nestjs/testing';
import CheckoutController from './checkout.controller';
import Checkout from '@/application/use-cases/checkout/checkout';
import { CheckoutInputDto } from '@/infraestructure/dtos/checkout.dto';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { PaymentStatus } from '@/domain/enums/payment-status';
import { PaymentTransaction } from '@/domain/types/payment';
import { TOKEN_SERVICE } from '@/shared/constants/service-constants';

const mockCheckoutUseCase = {
  execute: jest.fn(),
};

describe('CheckoutController', () => {
  let controller: CheckoutController;
  let checkoutUseCase: jest.Mocked<Checkout>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        { provide: TOKEN_SERVICE, useValue: { validateAccessToken: jest.fn().mockResolvedValue(true) } },
        {
          provide: Checkout,
          useValue: mockCheckoutUseCase,
        },
      ],
    }).compile();

    controller = module.get<CheckoutController>(CheckoutController);
    checkoutUseCase = module.get(Checkout);
    checkoutUseCase.execute.mockClear();
  });

  describe('createCheckout', () => {
    it('deve chamar o CheckoutUseCase com os parâmetros corretos e retornar o resultado', async () => {
      const checkoutDto: CheckoutInputDto = {
        paymentMethod: PaymentMethod.PIX,
      };
      const mockUserId = 'user-id-123';
      const mockRequest = {
        user: {
          id: mockUserId,
        },
      };
      const expectedTransactionResult: PaymentTransaction = {
        id: 'trans-id-456',
        status: PaymentStatus.PENDING,
        amount: 50000,
        qrCode: 'mock-qr-code',
        paymentUrl: 'http',
        dueDate: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCheckoutUseCase.execute.mockResolvedValue(expectedTransactionResult);
      const result = await controller.createCheckout(checkoutDto, mockRequest);
      expect(result).toEqual(expectedTransactionResult);
      expect(mockCheckoutUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockCheckoutUseCase.execute).toHaveBeenCalledWith({
        ...checkoutDto,
        userId: mockUserId,
      });
    });
  });
});
