import { PaymentStatus } from '@/domain/enums/payment-status';

export interface PaymentItem {
  description: string;
  price_cents: number;
  quantity: number;
  sku?: string;
}

export interface PaymentPayer {
  id: string; 
  name: string;
  email: string;
  phone?: string;
  cpf_cnpj?: string;
  address?: {
    zip_code: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    country: string;
    complement?: string;
  };
}

export interface PaymentTransaction {
  id: string; 
  status: PaymentStatus;
  amount: number; 
  dueDate: Date;
  paymentUrl?: string; 
  qrCode?: string; 
  qrCodeText?: string; 
  metadata: Record<string, any>; 
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
  errorCode?: string;
  metadata: Record<string, any>; 
}

export interface CreditCardPaymentData {
  token: string; 
  installments?: number;
}

export interface PaymentOptions {
  dueDate?: Date;
  notificationUrl?: string;
  customVariables?: Array<{ name: string; value: string }>;
}

export interface WebhookPayload {
  event: string;
  data: {
    id: string; 
    status: string; 
    // todo: verificar outros campos do iugu
  };
  timestamp: string;
}
