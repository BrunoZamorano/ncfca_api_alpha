import { Transaction as TransactionData, Prisma } from '@prisma/client';

import { PaymentStatus } from '@/domain/enums/payment-status';
import Transaction from '@/domain/entities/transaction/transaction';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { TransactionContextType } from '@/domain/enums/transaction-context-type';

export default class TransactionMapper {
  static toDomain(data: TransactionData): Transaction {
    return Transaction.create({
      id: data.id,
      status: data.status as PaymentStatus,
      gateway: data.gateway,
      userId: data.user_id,
      familyId: data.family_id,
      createdAt: data.created_at,
      contextType: data.context_type as TransactionContextType,
      amountCents: data.amount_cents,
      paymentMethod: data.payment_method as PaymentMethod,
      gatewayPayload: data.gateway_payload as Record<string, any>,
      gatewayTransactionId: data.gateway_transaction_id,
    });
  }

  //todo: decouple this from Prisma. open closed principle
  static toPersistence(entity: Transaction): Prisma.TransactionUncheckedCreateInput {
    return {
      id: entity.id,
      status: entity.status,
      user_id: entity.userId,
      gateway: entity.gateway,
      family_id: entity.familyId,
      created_at: entity.createdAt,
      context_type: entity.contextType,
      amount_cents: entity.amountCents,
      payment_method: entity.paymentMethod,
      gateway_payload: (entity.gatewayPayload as Prisma.JsonObject) ?? Prisma.JsonNull,
      gateway_transaction_id: entity.gatewayTransactionId,
    };
  }
}
