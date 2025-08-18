// src/shared/modules/webhook.module.ts

import { Module } from '@nestjs/common';
import ProcessPaymentUpdate from '@/application/use-cases/payment/process-payment-update/process-payment-update';
import SharedModule from '@/shared/modules/shared.module';
import WebhookController from '@/infraestructure/controllers/webhook/webhook.controller';

@Module({
  imports: [SharedModule],
  controllers: [WebhookController],
  providers: [ProcessPaymentUpdate],
})
export default class WebhookModule {}
