// src/infraestructure/repositories/transaction.repository.prisma.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import Transaction from '@/domain/entities/transaction/transaction';
import TransactionMapper from '@/shared/mappers/transaction.mapper';

@Injectable()
export class TransactionRepositoryPrisma implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Transaction | null> {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    return tx ? TransactionMapper.toDomain(tx) : null;
  }

  async findByGatewayTransactionId(gatewayId: string): Promise<Transaction | null> {
    const tx = await this.prisma.transaction.findUnique({ where: { gateway_transaction_id: gatewayId } });
    return tx ? TransactionMapper.toDomain(tx) : null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const txData = TransactionMapper.toPersistence(transaction);
    const savedTx = await this.prisma.transaction.upsert({
      where: { id: transaction.id },
      update: txData,
      create: txData,
    });
    return TransactionMapper.toDomain(savedTx);
  }
}