import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import Checkout from '@/application/use-cases/checkout/checkout';
import { PaymentTransaction } from '@/domain/types/payment';
import { CheckoutInputDto } from '@/infraestructure/dtos/checkout.dto';
import AuthGuard from '@/shared/guards/auth.guard';

@ApiTags('Afiliação e Pagamento')
@Controller('checkout')
export default class CheckoutController {
  constructor(private readonly checkout: Checkout) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Inicia o processo de pagamento da afiliação familiar' })
  @ApiResponse({
    status: 200,
    description: 'Pagamento processado ou iniciado com sucesso. Retorna os dados da transação do gateway.',
  })
  @ApiResponse({ status: 400, description: 'Dados de pagamento inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário ou família não encontrado.' })
  async createCheckout(
    @Body() checkoutInputDto: CheckoutInputDto,
    @Request() req: { user: { id: string } },
  ): Promise<PaymentTransaction> {
    const userId = req.user.id;
    return this.checkout.execute({ ...checkoutInputDto, userId });
  }
}
