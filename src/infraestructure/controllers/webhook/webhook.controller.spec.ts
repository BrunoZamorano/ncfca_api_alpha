import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import WebhookController from '@/infraestructure/controllers/webhook/webhook.controller';
import ProcessPaymentUpdate from '@/application/use-cases/process-payment-update/process-payment-update';
import { WebhookGuard } from '@/shared/guards/webhook/webhook.guard';

const mockProcessPaymentUpdate = {
  execute: jest.fn(),
};

describe('WebhookController', () => {
  let app = NestApplication;

  beforeEach(async function () {
    mockProcessPaymentUpdate.execute.mockClear();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [{ provide: ProcessPaymentUpdate, useValue: mockProcessPaymentUpdate }],
    })
      .overrideGuard(WebhookGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleFixture.createNestApplication();
  });
});
