import { Injectable } from '@nestjs/common';

import Transaction from '@/domain/entities/transaction/transaction';
import TransactionRepository from '@/domain/repositories/transaction.repository';

import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

@Injectable()
export default class TransactionRepositoryMemory implements TransactionRepository {
  private readonly db: InMemoryDatabase;

  constructor() {
    this.db = InMemoryDatabase.getInstance();
  }

  async findByGatewayTransactionId(gatewayId: string): Promise<Transaction | null> {
    const transaction = this.db.transactions.find((t) => t.gatewayTransactionId === gatewayId);
    return transaction ?? null;
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = this.db.transactions.find((t) => t.id === id);
    return transaction ?? null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const existingIndex = this.db.transactions.findIndex((t) => t.id === transaction.id);
    if (existingIndex !== -1) {
      this.db.transactions[existingIndex] = transaction;
    } else {
      this.db.transactions.push(transaction);
    }
    return transaction;
  }
}
