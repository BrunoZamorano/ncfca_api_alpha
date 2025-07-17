// src/infraestructure/dtos/payment-update.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class Data {
  @ApiProperty({ description: 'ID da transação no gateway de pagamento.', example: 'txn_1032HU2eZvKYlo2CEPtcnLVI' })
  @IsString({ message: 'id deve ser uma string.' })
  @IsNotEmpty({ message: 'id não pode estar vazio.' })
  id: string;

  @ApiProperty({ description: 'Novo status do pagamento.', example: 'PAID' })
  @IsString({ message: 'status deve ser uma string.' })
  @IsNotEmpty({ message: 'status não pode estar vazio.' })
  status: string;
}

export class PaymentUpdateInputDto {
  @ApiProperty({ description: 'Tipo do evento do webhook.', example: 'PAYMENT_CONFIRMED' })
  @IsString({ message: 'Event deve ser uma string.' })
  @IsNotEmpty({ message: 'Event não pode estar vazio.' })
  event: string;

  @ApiProperty({ description: 'Timestamp do evento.', example: '2025-07-16T22:30:00.000Z' })
  @IsString({ message: 'timestamp deve ser uma string.' })
  @IsNotEmpty({ message: 'timestamp não pode estar vazio.' })
  timestamp: string;

  @ApiProperty({ type: Data })
  @ValidateNested()
  @Type(() => Data)
  @IsNotEmpty({ message: 'Data não pode estar vazio.' })
  data: Data;
}
