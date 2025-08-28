---
status: pending
---

<task_context>
<domain>shared/infraestructure</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>medium</complexity>
<dependencies>1.0</dependencies>
</task_context>

# Tarefa 2.0: Criar EventModule e Centralizar Configuração do Producer

## Visão Geral

Nesta tarefa, vamos criar o `EventModule` para centralizar toda a configuração dos producers (clientes RabbitMQ). Isso removerá a configuração duplicada dos módulos de feature e fornecerá a implementação `RabbitMqEventEmitter` para toda a aplicação.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- O `EventModule` deve registrar todos os `ClientProxy` da aplicação.
- O módulo deve prover a implementação para o token `EVENT_EMITTER`.
- A implementação `RabbitMqEventEmitter` deve ser finalizada.
</requirements>

## Subtarefas

- [ ] 2.1 Criar o arquivo `src/shared/modules/event.module.ts`.
- [ ] 2.2 Mover as configurações `ClientsModule.registerAsync` dos arquivos `src/shared/modules/club-request.module.ts` and `src/shared/modules/tournament.module.ts` para o novo `EventModule`.
- [ ] 2.3 No `EventModule`, configurar o provider para o token `EVENT_EMITTER`, usando `RabbitMqEventEmitter` como `useClass`.
- [ ] 2.4 Finalizar a implementação de `RabbitMqEventEmitter` para injetar os `ClientProxy` via construtor e usar um `Map` para despachar as chamadas para o cliente correto.
- [ ] 2.5 Adicionar o `EventModule` aos `imports` do `AppModule` em `src/app.module.ts`.

## Detalhes de Implementação

### `event.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EVENT_EMITTER } from '@/domain/services/event-emitter.service';
import { RabbitMqEventEmitter } from '@/infraestructure/services/rabbitmq-event-emitter.service';
import { CLUB_EVENTS_SERVICE, TOURNAMENT_EVENTS_SERVICE } from './constants/service-constants';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: CLUB_EVENTS_SERVICE,
        // ... config de club-request.module.ts
      },
      {
        name: TOURNAMENT_EVENTS_SERVICE,
        // ... config de tournament.module.ts
      },
    ]),
  ],
  providers: [
    {
      provide: EVENT_EMITTER,
      useClass: RabbitMqEventEmitter,
    },
  ],
  exports: [EVENT_EMITTER],
})
export class EventModule {}
```

## Critérios de Sucesso

- O `EventModule` foi criado e configura todos os clientes RabbitMQ.
- As configurações de `ClientsModule` foram removidas de `club-request.module.ts` e `tournament.module.ts`.
- `RabbitMqEventEmitter` está totalmente implementado e funcional.
- O `AppModule` importa o `EventModule`.
