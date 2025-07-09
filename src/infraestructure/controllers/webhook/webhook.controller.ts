import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import ProcessPaymentUpdate from '@/application/use-cases/process-payment-update/process-payment-update';

import { PaymentUpdateInputDto } from '@/infraestructure/dtos/payment-update.dto';

@Controller('webhook')
export default class WebhookController {
  constructor(private readonly _processPaymentUpdate: ProcessPaymentUpdate) {}

  @Post('payment-updates')
  @HttpCode(HttpStatus.NO_CONTENT)
  async processPaymentUpdate(@Body() payload: PaymentUpdateInputDto): Promise<void> {
    await this._processPaymentUpdate.execute(payload);
  }
}
