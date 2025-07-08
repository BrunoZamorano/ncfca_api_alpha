// test/checkout.e2e-spec.ts

import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';

import { AppModule } from '@/app.module';
import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';
import { PAYMENT_GATEWAY } from '@/shared/constants/service-constants';
import { RegisterUserInputDto } from '@/infraestructure/dtos/register-user.dto';
import Cpf from '@/domain/value-objects/cpf/cpf';
import User from '@/domain/entities/user/user';
import { CheckoutInputDto } from '@/infraestructure/dtos/checkout.dto';
import { PaymentMethod } from '@/domain/enums/payment-method';
import { PaymentStatus } from '@/domain/enums/payment-status';
import { PaymentGatewayMemory } from '@/infraestructure/services/payment-gateway.memory';

describe('CheckoutController (e2e)', () => {
  let app: INestApplication<App>;
  let paymentGateway: PaymentGatewayMemory;

  const testUser: RegisterUserInputDto = {
    firstName: 'Checkout',
    lastName: 'User',
    password: 'Password@123',
    phone: User.DEFAULT_PHONE,
    email: 'checkout-user@test.com',
    cpf: Cpf.VALID_CPF,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PAYMENT_GATEWAY) // 1. Sobrescreve o provedor do gateway
      .useClass(PaymentGatewayMemory)    //    com a nossa implementação em memória
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    paymentGateway = app.get<PaymentGatewayMemory>(PAYMENT_GATEWAY);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/checkout (POST)', () => {
    let accessToken: string;

    // Antes de cada teste neste bloco, cria um usuário e faz login para obter o token
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/account/user').send(testUser);
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      accessToken = loginResponse.body.accessToken;
    });

    it('deve processar um checkout com PIX com sucesso para um usuário autenticado', () => {
      const checkoutDto: CheckoutInputDto = {
        paymentMethod: PaymentMethod.PIX,
      };

      return request(app.getHttpServer())
        .post('/checkout')
        .set('Authorization', `Bearer ${accessToken}`) // 2. Usa o token de autenticação
        .send(checkoutDto)
        .expect(HttpStatus.OK) // 3. Verifica se o status é 200 OK
        .expect((res) => {
          // 4. Verifica a estrutura da resposta
          expect(res.body.id).toBeDefined();
          expect(res.body.status).toEqual(PaymentStatus.PENDING);
          expect(res.body.amount).toBe(50000); // Valor definido no caso de uso
          expect(res.body.paymentUrl).toBeDefined();
          expect(res.body.qrCode).toBeDefined();
        });
    });

    it('deve processar um checkout com Cartão de Crédito com sucesso', () => {
      const checkoutDto: CheckoutInputDto = {
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentToken: 'valid-token', // Usa o token mágico para simular sucesso
        installments: 1,
      };

      return request(app.getHttpServer())
        .post('/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(checkoutDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          // No pagamento com cartão, o status final já vem como pago na simulação
          expect(res.body.status).toEqual(PaymentStatus.PAID);
          expect(res.body.amount).toBe(50000);
        });
    });

    it('deve retornar 401 Unauthorized se nenhum token for fornecido', () => {
      const checkoutDto: CheckoutInputDto = {
        paymentMethod: PaymentMethod.PIX,
      };

      return request(app.getHttpServer())
        .post('/checkout')
        .send(checkoutDto)
        .expect(HttpStatus.UNAUTHORIZED); // 5. Verifica se o acesso não autorizado é bloqueado
    });

    it('deve retornar 400 Bad Request se o corpo da requisição for inválido', () => {
      return request(app.getHttpServer())
        .post('/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}) // Envia um corpo vazio para acionar a validação
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toEqual(expect.any(Array));
          expect(res.body.message).toContain('O método de pagamento deve ser um dos seguintes: credit_card, pix, bank_slip');
        });
    });
  });
});