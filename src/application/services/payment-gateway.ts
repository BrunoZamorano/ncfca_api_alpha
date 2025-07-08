import {
  PaymentItem,
  PaymentPayer,
  PaymentResult,
  PaymentOptions,
  PaymentTransaction,
  CreditCardPaymentData,
} from '@/domain/types/payment';
import { PaymentMethod } from '@/domain/enums/payment-method';

export interface PaymentGateway {
  name: string;
  createTransaction(
    paymentMethod: PaymentMethod,
    items: PaymentItem[],
    payer: PaymentPayer,
    options?: PaymentOptions,
  ): Promise<PaymentTransaction>;
  processCreditCardPayment(transactionId: string, creditCardData: CreditCardPaymentData): Promise<PaymentResult>;
}
