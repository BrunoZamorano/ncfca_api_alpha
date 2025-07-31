import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import ProcessPaymentUpdate from '@/application/use-cases/process-payment-update/process-payment-update';
import { PaymentUpdateInputDto } from '@/infraestructure/dtos/payment-update.dto';

// Exclui este controlador da documentação OpenAPI, pois não é uma API pública para consumo geral.
@ApiExcludeController()
@Controller('webhook')
export default class WebhookController {
  constructor(private readonly _processPaymentUpdate: ProcessPaymentUpdate) {}

  @Post('payment-updates')
  @HttpCode(HttpStatus.NO_CONTENT)
  // Este endpoint não é documentado publicamente com detalhes, pois é de sistema.
  // A validação de assinatura deve ocorrer em um Guard (não mostrado aqui).
  async processPaymentUpdate(@Body() payload: PaymentUpdateInputDto): Promise<void> {
    await this._processPaymentUpdate.execute(payload);
  }
}
