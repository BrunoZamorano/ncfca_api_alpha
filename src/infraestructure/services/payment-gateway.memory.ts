// src/infraestructure/services/payment-gateway-memory.ts

import { Injectable, Logger } from '@nestjs/common';
import { PaymentGateway } from '@/application/services/payment-gateway';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { PaymentStatus } from '@/domain/enums/payment-status';
import { CreditCardPaymentData, PaymentItem, PaymentPayer, PaymentResult, PaymentTransaction } from '@/domain/types/payment';

@Injectable()
export class PaymentGatewayMemory implements PaymentGateway {
  private readonly logger = new Logger(PaymentGatewayMemory.name);
  public readonly name = 'PaymentGatewayMemory';
  private transactions: Map<string, PaymentTransaction> = new Map();

  async createTransaction(paymentMethod: PaymentMethod, items: PaymentItem[], payer: PaymentPayer): Promise<PaymentTransaction> {
    const transactionId = crypto.randomUUID();
    const amount = items.reduce((total, item) => total + item.price_cents * item.quantity, 0);
    const now = new Date();
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Vencimento em 24 horas

    const baseTransaction: Omit<PaymentTransaction, 'status'> = {
      id: transactionId,
      amount: amount,
      dueDate: dueDate,
      metadata: { payer, items },
      createdAt: now,
      updatedAt: now,
    };

    let specificTransaction: PaymentTransaction;

    // Simula diferentes respostas com base no método de pagamento
    if (paymentMethod === PaymentMethod.PIX) {
      specificTransaction = {
        ...baseTransaction,
        status: PaymentStatus.PENDING,
        paymentUrl: `https://mock-payment-gateway.com/pix/${transactionId}`,
        qrCode: `QRCodeFor_${transactionId}`,
        qrCodeText: `PixCopiaEColaPara_${transactionId}`,
      };
    } else {
      // Para outros métodos como Cartão de Crédito, a transação começa pendente
      // até ser processada.
      specificTransaction = {
        ...baseTransaction,
        status: PaymentStatus.PENDING,
      };
    }

    this.transactions.set(transactionId, specificTransaction);
    this.logger.log(`[${this.createTransaction.name}] Transação criada: ${transactionId}`);
    return Promise.resolve(specificTransaction);
  }

  /**
   * Processa um pagamento com cartão de crédito.
   * Simula a lógica de sucesso ou falha com base no token.
   */
  async processCreditCardPayment(transactionId: string, creditCardData: CreditCardPaymentData): Promise<PaymentResult> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Lógica de simulação: "valid-token" para sucesso, qualquer outro para falha.
    if (creditCardData.token === 'valid-token') {
      transaction.status = PaymentStatus.PAID;
      this.transactions.set(transactionId, transaction);
      this.logger.log(`[${this.createTransaction.name}] Pagamento APROVADO para a transação: ${transactionId}`);
      return Promise.resolve({
        success: true,
        transactionId: transactionId,
        message: 'Payment approved',
        metadata: { gateway: this.name },
      });
    } else {
      transaction.status = PaymentStatus.FAILED;
      this.transactions.set(transactionId, transaction);
      this.logger.log(`[${this.createTransaction.name}] Pagamento RECUSADO para a transação: ${transactionId}`);
      return Promise.resolve({
        success: false,
        transactionId: transactionId,
        message: 'Payment declined',
        errorCode: 'CARD_DECLINED',
        metadata: { gateway: this.name },
      });
    }
  }
}
