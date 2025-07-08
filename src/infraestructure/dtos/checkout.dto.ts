import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { PaymentMethod } from '@/domain/enums/payment-method';

export class CheckoutInputDto {
  @IsEnum(PaymentMethod, {
    message: 'O método de pagamento deve ser um dos seguintes: credit_card, pix, bank_slip',
  })
  @IsNotEmpty({ message: 'O método de pagamento não pode estar vazio.' })
  paymentMethod: PaymentMethod;

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CREDIT_CARD)
  @IsNotEmpty({ message: 'O token de pagamento é obrigatório para cartão de crédito.' })
  @IsString()
  paymentToken?: string;

  @IsOptional()
  @IsInt({ message: 'O número de parcelas deve ser um número inteiro.' })
  @Min(1, { message: 'O número mínimo de parcelas é 1.' })
  @Max(12, { message: 'O número máximo de parcelas é 12' })
  installments?: number;
}
