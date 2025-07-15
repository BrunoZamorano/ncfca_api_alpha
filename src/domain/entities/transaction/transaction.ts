import { PaymentStatus } from '@/domain/enums/payment-status';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { TransactionContextType } from '@/domain/enums/transaction-context-type';

export default class Transaction {
  public status: PaymentStatus;
  public readonly gatewayTransactionId: string;
  public readonly gatewayPayload: Record<string, any>;
  public readonly paymentMethod: PaymentMethod;
  public readonly amountCents: number;
  public readonly contextType: TransactionContextType;
  public readonly createdAt: Date;
  public readonly familyId: string;
  public readonly gateway: string;
  public readonly userId: string;
  public readonly id: string;

  private constructor(props: TransactionProps) {
    this.gatewayTransactionId = props.gatewayTransactionId;
    this.gatewayPayload = props.gatewayPayload;
    this.paymentMethod = props.paymentMethod
    this.amountCents = props.amountCents;
    this.contextType = props.contextType;
    this.createdAt = props.createdAt;
    this.familyId = props.familyId;
    this.gateway = props.gateway;
    this.userId = props.userId;
    this.status = props.status;
    this.id = props.id;
  }

  public static create(props: Omit<TransactionProps, 'createdAt'> & { createdAt?: Date }): Transaction {
    return new Transaction({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  public changeStatus(status: PaymentStatus): void {
    this.status = status;
  }
}

export interface TransactionProps {
  gatewayTransactionId: string;
  gatewayPayload: Record<string, any>;
  paymentMethod: PaymentMethod;
  amountCents: number;
  contextType: TransactionContextType;
  createdAt: Date;
  familyId: string;
  gateway: string;
  userId: string;
  status: PaymentStatus;
  id: string;
}
