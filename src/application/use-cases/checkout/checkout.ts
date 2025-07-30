import { Inject, Injectable } from '@nestjs/common';
import { FAMILY_REPOSITORY, TRANSACTION_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { PaymentGateway } from '@/application/services/payment-gateway';
import IdGenerator from '@/application/services/id-generator';
import { ID_GENERATOR, PAYMENT_GATEWAY } from '@/shared/constants/service-constants';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';
import { PaymentItem, PaymentPayer, PaymentTransaction } from '@/domain/types/payment';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { DomainException, EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import Transaction from '@/domain/entities/transaction/transaction';
import { FamilyStatus } from '@/domain/enums/family-status';
import { TransactionContextType } from '@/domain/enums/transaction-context-type';

@Injectable()
export default class Checkout {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepository,
    @Inject(FAMILY_REPOSITORY) private readonly familyRepository: FamilyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGateway,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: Input): Promise<PaymentTransaction> {
    const user = await this.userRepository.find(input.userId);
    if (!user) throw new EntityNotFoundException('User', input.userId);
    const family = await this.familyRepository.findByHolderId(input.userId);
    if (!family) throw new EntityNotFoundException('Family', `for user ${user.id}`);
    if (family.status === FamilyStatus.AFFILIATED) throw new DomainException('FAMILY_ALREADY_AFFILIATED');
    const payer: PaymentPayer = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      email: user.email,
      cpf_cnpj: user.cpf,
      address: {
        city: user.address.city,
        state: user.address.state,
        number: user.address.number,
        street: user.address.street,
        zip_code: user.address.zipCode,
        district: user.address.district,
        complement: user.address.complement,
      },
    };
    const items: PaymentItem[] = [{ quantity: 1, price_cents: 50000, description: 'Taxa de Afiliação NCFCA Brasil' }];
    const gatewayTransaction = await this.paymentGateway.createTransaction(input.paymentMethod, items, payer);
    if (input.paymentMethod === PaymentMethod.CREDIT_CARD) {
      if (!input.paymentToken) throw new DomainException('Payment token is required for credit card payments.');
      const paymentResult = await this.paymentGateway.processCreditCardPayment(gatewayTransaction.id, {
        installments: input.installments,
        token: input.paymentToken,
      });
      if (!paymentResult.success) throw new DomainException(`PAYMENT_FAILED: ${paymentResult.message}`);
      family.activateAffiliation();
      await this.familyRepository.save(family);
    }
    const localTransaction = Transaction.create({
      gatewayTransactionId: gatewayTransaction.id,
      gatewayPayload: gatewayTransaction.metadata,
      paymentMethod: input.paymentMethod,
      contextType: TransactionContextType.FAMILY_AFFILIATION,
      amountCents: gatewayTransaction.amount,
      familyId: family.id,
      gateway: this.paymentGateway.name,
      status: gatewayTransaction.status,
      userId: input.userId,
      id: this.idGenerator.generate(),
    });
    await this.transactionRepository.save(localTransaction);
    return gatewayTransaction;
  }
}

interface Input {
  paymentMethod: PaymentMethod;
  installments?: number;
  paymentToken?: string;
  userId: string;
}
