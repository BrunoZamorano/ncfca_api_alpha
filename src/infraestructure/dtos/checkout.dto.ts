// src/infraestructure/dtos/checkout.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { PaymentMethod } from '@/domain/enums/payment-method';

export class CheckoutInputDto {
  @ApiProperty({
    description: 'Método de pagamento escolhido para a afiliação.',
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
  })
  @IsEnum(PaymentMethod, {
    message: 'O método de pagamento deve ser um dos seguintes: CREDIT_CARD, PIX',
  })
  @IsNotEmpty({ message: 'O método de pagamento não pode estar vazio.' })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Token do cartão de crédito, gerado pelo frontend. Obrigatório se paymentMethod for CREDIT_CARD.',
    example: 'tok_1J9X2e2eZvKYlo2C8c2a3e6E',
    required: false,
  })
  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CREDIT_CARD)
  @IsNotEmpty({ message: 'O token de pagamento é obrigatório para cartão de crédito.' })
  @IsString()
  paymentToken?: string;

  @ApiProperty({
    description: 'Número de parcelas. Válido apenas para CREDIT_CARD.',
    example: 1,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'O número de parcelas deve ser um número inteiro.' })
  @Min(1, { message: 'O número mínimo de parcelas é 1.' })
  @Max(12, { message: 'O número máximo de parcelas é 12' })
  installments?: number;
}
