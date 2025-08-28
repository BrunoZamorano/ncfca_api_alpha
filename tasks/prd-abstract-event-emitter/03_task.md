---
status: pending
---

<task_context>
<domain>infraestructure</domain>
<type>refactoring</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 3.0: Centralizar Configuração do Consumer (Microserviço)

## Visão Geral

Para melhorar a organização e limpar o arquivo de bootstrap (`main.ts`), vamos mover a lógica de conexão dos microserviços (consumers) para um arquivo de configuração dedicado.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- A lógica de `app.connectMicroservice` deve ser removida de `main.ts`.
- A nova função deve ser chamada a partir de `main.ts` para manter o comportamento.
</requirements>

## Subtarefas

- [ ] 3.1 Criar o arquivo `src/infraestructure/messaging/microservices.config.ts`.
- [ ] 3.2 Criar uma função `connectMicroservices(app: INestApplication)` no novo arquivo.
- [ ] 3.3 Mover as duas chamadas `app.connectMicroservice` de `src/main.ts` para dentro da função `connectMicroservices`.
- [ ] 3.4 Importar e chamar a função `connectMicroservices(app)` de `src/main.ts` no local onde o código foi removido.

## Detalhes de Implementação

### `microservices.config.ts`
```typescript
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export function connectMicroservices(app: INestApplication) {
  const configService = app.get(ConfigService);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') || ''],
      queue: 'ClubRequest',
      // ... resto da configuração
    },
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') || ''],
      queue: 'TournamentRegistration',
      // ... resto da configuração
    },
  });
}
```

### `main.ts` (Modificado)
```typescript
// ... imports
import { connectMicroservices } from '@/infraestructure/messaging/microservices.config';

async function bootstrap() {
  // ... criação do app

  connectMicroservices(app);

  // ... resto do bootstrap
}
```

## Critérios de Sucesso

- O arquivo `microservices.config.ts` foi criado com a função `connectMicroservices`.
- O arquivo `main.ts` está mais limpo e chama a nova função para conectar os microserviços.
- A aplicação inicia e os consumers continuam funcionando como esperado.
