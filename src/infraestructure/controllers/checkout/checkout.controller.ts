import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import AuthGuard from '@/shared/guards/auth.guard';
import Checkout from '@/application/use-cases/checkout/checkout';
import { CheckoutInputDto } from '@/infraestructure/dtos/checkout.dto';
import { PaymentTransaction } from '@/domain/types/payment';

@Controller('checkout')
export default class CheckoutController {
  constructor(private readonly checkout: Checkout) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @Body() checkoutInputDto: CheckoutInputDto,
    @Request() req: { user: { sub: string } },
  ): Promise<PaymentTransaction> {
    const userId = req.user.sub;
    return this.checkout.execute({
      ...checkoutInputDto,
      userId,
    });
  }
}
