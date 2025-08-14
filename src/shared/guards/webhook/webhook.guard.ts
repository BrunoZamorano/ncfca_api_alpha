import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class WebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { rawBody: Buffer }>();
    const signature = request.headers['x-signature'] as string;
    if (!signature) {
      throw new UnauthorizedException('Assinatura do webhook em falta.');
    }
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('Corpo da requisição "cru" não encontrado. Verifique a configuração do rawBody no main.ts.');
    }
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('Chave secreta do webhook não configurada no servidor.');
    }
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const trusted = Buffer.from(expectedSignature, 'ascii');
    const untrusted = Buffer.from(signature, 'ascii');
    if (!crypto.timingSafeEqual(trusted, untrusted)) {
      throw new UnauthorizedException('Assinatura do webhook inválida.');
    }
    return true;
  }
}
