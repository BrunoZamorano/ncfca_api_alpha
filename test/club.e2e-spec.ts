import * as request from 'supertest';

import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';

import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';
import AnemicTokenService from '@/infraestructure/services/anemic-token-service';

import { TOKEN_SERVICE } from '@/shared/constants/service-constants';

import { AppModule } from '@/app.module';

describe('ClubController (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_SERVICE)
      .useClass(AnemicTokenService)
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.set('query parser', 'extended');
    await app.init();
  });

  describe('/club (POST)', function () {
    it('Deve retornar todos os clubes até o limite máximo', async function () {
      return request(app.getHttpServer())
        .get('/club?pagination[page]=1&pagination[limit]=100')
        .set('Authorization', 'Bearer ' + AnemicTokenService.ACCESS_TOKEN)
        .expect(HttpStatus.OK)
        .expect(async (res) => {
          const { meta, data } = res.body;
          expect(meta.totalPages).toBe(3);
          expect(data.length).toBe(100);
          expect(meta.limit).toBe(100);
          expect(meta.total).toBe(250);
          expect(meta.page).toBe(1);
        });
    });

    it('Deve retornar erro se o token de acesso não for fornecido', async function () {
      return request(app.getHttpServer())
        .get('/club?pagination[page]=1&pagination[limit]=100')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
