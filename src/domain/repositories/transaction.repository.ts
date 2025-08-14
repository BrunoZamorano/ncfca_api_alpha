import Transaction from '@/domain/entities/transaction/transaction';

export default interface TransactionRepository {
  findByGatewayTransactionId(gatewayId: string): Promise<Transaction | null>;
  findById(id: string): Promise<Transaction | null>;
  save(transaction: Transaction): Promise<Transaction>;
};;;;;;;;;;
