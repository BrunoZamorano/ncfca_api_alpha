import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import GlobalExceptionFilter from '@/infraestructure/filters/global-exception-filter';
import { AppModule } from '@/app.module';
import { adminSeed } from '@/admin.seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.set('query parser', 'extended');
  await adminSeed(app);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
