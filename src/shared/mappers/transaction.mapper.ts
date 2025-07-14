import { Transaction as TransactionData, Prisma } from '@prisma/client';

import { PaymentStatus } from '@/domain/enums/payment-status';
import Transaction from '@/domain/entities/transaction/transaction';

export default class TransactionMapper {
  static toDomain(data: TransactionData): Transaction {
    return Transaction.create({
      id: data.id,
      status: data.status as PaymentStatus,
      gateway: data.gateway,
      familyId: data.family_id,
      createdAt: data.created_at,
      amountCents: data.amount_cents,
      paymentMethod: data.payment_method ?? 'N/A',
      gatewayPayload: data.gateway_payload as Record<string, any>,
      gatewayTransactionId: data.gateway_transaction_id,
    });
  }

  //todo: decouple this from Prisma. open closed principle
  static toPersistence(entity: Transaction): Prisma.TransactionUncheckedCreateInput {
    return {
      id: entity.id,
      status: entity.status,
      gateway: entity.gateway,
      family_id: entity.familyId,
      created_at: entity.createdAt,
      amount_cents: entity.amountCents,
      payment_method: entity.paymentMethod,
      gateway_payload: (entity.gatewayPayload as Prisma.JsonObject) ?? Prisma.JsonNull,
      gateway_transaction_id: entity.gatewayTransactionId,
    };
  }
}
