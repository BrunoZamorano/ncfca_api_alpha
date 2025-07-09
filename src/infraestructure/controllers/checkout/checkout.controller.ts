import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';

import Checkout from '@/application/use-cases/checkout/checkout';

import { PaymentTransaction } from '@/domain/types/payment';

import { CheckoutInputDto } from '@/infraestructure/dtos/checkout.dto';

import AuthGuard from '@/shared/guards/auth.guard';

@Controller('checkout')
export default class CheckoutController {
  constructor(private readonly checkout: Checkout) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @Body() checkoutInputDto: CheckoutInputDto,
    @Request() req: { user: { id: string } },
  ): Promise<PaymentTransaction> {
    const userId = req.user.id;
    return this.checkout.execute({ ...checkoutInputDto, userId });
  }
}
