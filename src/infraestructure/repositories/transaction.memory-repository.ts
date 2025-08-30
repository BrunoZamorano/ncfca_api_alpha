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

  findByGatewayTransactionId(gatewayId: string): Promise<Transaction | null> {
    const transaction = this.db.transactions.find((t) => t.gatewayTransactionId === gatewayId);
    return Promise.resolve(transaction ?? null);
  }

  findById(id: string): Promise<Transaction | null> {
    const transaction = this.db.transactions.find((t) => t.id === id);
    return Promise.resolve(transaction ?? null);
  }

  save(transaction: Transaction): Promise<Transaction> {
    const existingIndex = this.db.transactions.findIndex((t) => t.id === transaction.id);
    if (existingIndex !== -1) {
      this.db.transactions[existingIndex] = transaction;
    } else {
      this.db.transactions.push(transaction);
    }
    return Promise.resolve(transaction);
  }
}
