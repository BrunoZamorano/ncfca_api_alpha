// generate-openapi.ts

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '@/app.module';
import * as fs from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';

async function generateOpenApiSpec() {
  // Inicializa a aplicação da mesma forma que em main.ts, mas sem o app.listen()
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false, // Desliga os logs para um output limpo
  });

  // Reutiliza a mesma configuração exata do seu main.ts
  const config = new DocumentBuilder()
    .setTitle('API NCFCA')
    .setDescription(
      'Documentação da API para o sistema NCFCA. Esta é a única fonte de verdade para os contratos da API.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entre com o token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Escreve o documento gerado num ficheiro openapi.json
  fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));

  console.log('Especificação OpenAPI gerada com sucesso em openapi.json');
  await app.close();
}

generateOpenApiSpec();
