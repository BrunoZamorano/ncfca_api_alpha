import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import ProcessPaymentUpdate from '@/application/use-cases/process-payment-update/process-payment-update';

import { WebhookPayload } from '@/domain/types/payment';

import { WebhookGuard } from '@/shared/guards/webhook/webhook.guard';

@Controller('webhooks')
export default class WebhookController {
  constructor(private readonly _processPaymentUpdate: ProcessPaymentUpdate) {}

  @Post('payment-updates')
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async processPaymentUpdate(@Body() payload: WebhookPayload): Promise<void> {
    await this._processPaymentUpdate.execute(payload);
  }
}
