import { Inject, Injectable, Logger } from '@nestjs/common';

import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { WebhookPayload } from '@/domain/types/payment';
import { PaymentStatus } from '@/domain/enums/payment-status';
import { FamilyStatus } from '@/domain/enums/family-status';

@Injectable()
export default class ProcessPaymentUpdate {
  private readonly logger = new Logger(ProcessPaymentUpdate.name);

  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(payload: WebhookPayload): Promise<void> {
    await this.uow.beginTransaction();
    try {
      const gatewayTransactionId = payload.data.id;
      const newStatus = payload.data.status as PaymentStatus;
      this.logger.log(`Processando evento '${payload.event}' para a transação do gateway: ${gatewayTransactionId}`);
      const transaction = await this.uow.transactionRepository.findByGatewayTransactionId(gatewayTransactionId);
      if (!transaction) {
        this.logger.warn(`Transação com gateway ID ${gatewayTransactionId} não encontrada. Ignorando webhook.`);
        await this.uow.commit();
        return void 0;
      }
      if (transaction.status === newStatus) {
        this.logger.log(`Transação ${transaction.id} já está com o status ${newStatus}. Nenhuma ação necessária.`);
        await this.uow.commit();
        return void 0;
      }
      transaction.changeStatus(newStatus);
      if (newStatus !== PaymentStatus.PAID) {
        await this.uow.transactionRepository.save(transaction);
        this.logger.log(`Transação ${transaction.id} atualizada para o status: ${newStatus}. Nenhuma ação na família.`);
        await this.uow.commit();
        return void 0;
      }
      const family = await this.uow.familyRepository.find(transaction.familyId);
      if (!family) throw new EntityNotFoundException('Family', transaction.familyId);
      if (family.status === FamilyStatus.AFFILIATED) {
        this.logger.log(
          `Família ${transaction.familyId} já está com o status ${family.status}. Transação Salva. Nenhuma ação necessária.`,
        );
        await this.uow.commit();
        return void 0;
      }
      family.activateAffiliation();
      await this.uow.familyRepository.save(family);
      await this.uow.transactionRepository.save(transaction);
      await this.uow.commit();
      this.logger.log(
        `Afiliação da família ${family.id} ativada. Transação ${transaction.id} atualizada para ${newStatus}.`,
      );
      return void 0;
    } catch (error) {
      await this.uow.rollback();
      this.logger.error(`Erro ao processar webhook: ${error.message}`);
      throw error;
    }
  }
}
