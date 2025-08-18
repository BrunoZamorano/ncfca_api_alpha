// src/shared/modules/checkout.module.ts

import { Module } from '@nestjs/common';
import CheckoutController from '@/infraestructure/controllers/checkout/checkout.controller';
import Checkout from '@/application/use-cases/checkout/checkout.use-case';
import SharedModule from '@/shared/modules/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CheckoutController],
  providers: [Checkout],
})
export default class CheckoutModule {}
