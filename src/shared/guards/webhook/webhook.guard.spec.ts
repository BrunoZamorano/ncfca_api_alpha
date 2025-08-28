import * as crypto from 'crypto';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { WebhookGuard } from './webhook.guard';

describe('WebhookGuard', () => {
  let guard: WebhookGuard;
  let mockContext: ExecutionContext;
  let mockConfigService: ConfigService;

  const secret = 'chave-secreta-para-teste';

  const createMockContext = (headers: any, rawBody: Buffer) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers, rawBody }),
      }),
    } as ExecutionContext;
  };

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue(secret),
    } as any;
    guard = new WebhookGuard(mockConfigService);
  });

  it('deve retornar true para uma assinatura válida', () => {
    const payload = JSON.stringify({ event: 'payment.paid', data: { id: 'trans_123' } });
    const rawBody = Buffer.from(payload);
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    mockContext = createMockContext({ 'x-signature': signature }, rawBody);
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('deve lançar UnauthorizedException se a assinatura estiver em falta', () => {
    const rawBody = Buffer.from('qualquer-coisa');
    mockContext = createMockContext({}, rawBody);
    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('Assinatura do webhook em falta.');
  });

  it('deve lançar UnauthorizedException se o corpo "cru" (rawBody) estiver em falta', () => {
    mockContext = createMockContext({ 'x-signature': 'assinatura-qualquer' }, null as unknown as Buffer);
    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('Corpo da requisição "cru" não encontrado.');
  });

  it('deve lançar UnauthorizedException para uma assinatura inválida', () => {
    const payload = JSON.stringify({ event: 'payment.paid' });
    const rawBody = Buffer.from(payload);
    const signatureInvalida = 'a'.repeat(64);
    mockContext = createMockContext({ 'x-signature': signatureInvalida }, rawBody);
    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('Assinatura do webhook inválida.');
  });

  it('deve lançar um Erro interno se a chave secreta não estiver configurada no ambiente', () => {
    (mockConfigService.get as jest.Mock).mockReturnValue('');
    const payload = JSON.stringify({ event: 'payment.paid' });
    const rawBody = Buffer.from(payload);
    const signature = 'uma-assinatura-qualquer';
    mockContext = createMockContext({ 'x-signature': signature }, rawBody);
    expect(() => guard.canActivate(mockContext)).toThrow(Error);
    expect(() => guard.canActivate(mockContext)).toThrow('Chave secreta do webhook não configurada no servidor.');
    (mockConfigService.get as jest.Mock).mockReturnValue(secret);
  });
});
