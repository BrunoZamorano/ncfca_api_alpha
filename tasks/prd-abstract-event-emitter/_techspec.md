# Tech Spec: Abstração do Emissor de Eventos com RabbitMQ

## 1. Visão Geral

Esta especificação técnica detalha o plano para abstrair o mecanismo de emissão de eventos no sistema. O objetivo é centralizar a configuração do RabbitMQ, desacoplar os produtores de eventos da implementação do `ClientProxy` do NestJS e simplificar a emissão de eventos em toda a aplicação, seguindo padrões de design já existentes como `UnitOfWork` e `QueryService`.

## 2. Componentes Principais

### 2.1. `EventEmitter` Interface (Domínio)

Uma interface que define o contrato para a emissão de eventos.

- **Localização:** `src/domain/services/event-emitter.service.ts`
- **Responsabilidade:** Definir o método `emit` de forma agnóstica à implementação.

```typescript
// src/domain/services/event-emitter.service.ts
export interface EventEmitter {
  emit<T>(service: string, pattern: string, payload: T): void;
}

export const EVENT_EMITTER = Symbol('EVENT_EMITTER');
```

### 2.2. `RabbitMqEventEmitter` (Infraestrutura)

A implementação concreta da interface `EventEmitter` que utiliza o `ClientProxy` do NestJS para interagir com o RabbitMQ.

- **Localização:** `src/infraestructure/services/rabbitmq-event-emitter.service.ts`
- **Responsabilidade:** Atuar como uma fachada (`Facade`) para os `ClientProxy`, gerenciando múltiplos clientes e direcionando as chamadas para o serviço correto.

```typescript
// Estrutura da classe
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventEmitter } from '@/domain/services/event-emitter.service';
import { CLUB_EVENTS_SERVICE, TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/service-constants';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RabbitMqEventEmitter implements EventEmitter {
  private clients: Map<string, ClientProxy> = new Map();

  constructor(
    @Inject(CLUB_EVENTS_SERVICE) private readonly clubClient: ClientProxy,
    @Inject(TOURNAMENT_EVENTS_SERVICE) private readonly tournamentClient: ClientProxy,
  ) {
    this.clients.set(CLUB_EVENTS_SERVICE, this.clubClient);
    this.clients.set(TOURNAMENT_EVENTS_SERVICE, this.tournamentClient);
  }

  emit<T>(service: string, pattern: string, payload: T): void {
    // ... implementação
  }

  send<T, R>(service: string, pattern: string, payload: T): Promise<R> {
    // ... implementação
  }
}
```

### 2.3. `EventModule` (Compartilhado)

Um módulo NestJS para centralizar a configuração dos produtores (clientes) RabbitMQ.

- **Localização:** `src/shared/modules/event.module.ts`
- **Responsabilidade:** Registrar todos os `ClientProxy` da aplicação via `ClientsModule` e prover a implementação `RabbitMqEventEmitter` para o token `EVENT_EMITTER`.

### 2.4. `connectMicroservices` (Infraestrutura)

Uma função para centralizar a configuração dos consumidores (microserviços) RabbitMQ.

- **Localização:** `src/infraestructure/messaging/microservices.config.ts`
- **Responsabilidade:** Conectar todos os microserviços da aplicação, removendo essa lógica do `main.ts`.

## 3. Plano de Implementação

1.  **Criação da Interface e Implementação:**
    -   Criar o arquivo e a interface `EventEmitter` no domínio.
    -   Criar o arquivo e a estrutura da classe `RabbitMqEventEmitter` na infraestrutura.

2.  **Criação do `EventModule`:**
    -   Criar o `EventModule`.
    -   Mover as configurações do `ClientsModule` de `club-request.module.ts` e `tournament.module.ts` para o `EventModule`.
    -   Configurar o `EventModule` para prover `RabbitMqEventEmitter`.

3.  **Centralização da Configuração do Consumer:**
    -   Criar o arquivo `src/infraestructure/messaging/microservices.config.ts`.
    -   Mover a lógica de `app.connectMicroservice` de `main.ts` para a nova função `connectMicroservices`.
    -   Chamar `connectMicroservices(app)` em `main.ts`.

4.  **Refatoração:**
    -   Alterar `club-request.module.ts` e `tournament.module.ts` para importar o `EventModule` em vez de configurar o `ClientsModule`.
    -   Atualizar os serviços que injetam `ClientProxy` para injetar `EVENT_EMITTER` e usar a nova abstração.
    -   Validar as mudanças com os testes E2E existentes.

## 4. Estrutura de Arquivos

### Novos Arquivos

-   `src/domain/services/event-emitter.service.ts`
-   `src/infraestructure/services/rabbitmq-event-emitter.service.ts`
-   `src/shared/modules/event.module.ts`
-   `src/infraestructure/messaging/microservices.config.ts`

### Arquivos Modificados

-   `src/main.ts`
-   `src/shared/modules/club-request.module.ts`
-   `src/shared/modules/tournament.module.ts`
-   `src/application/listeners/publish-integration-event-on-registration-confirmed.listener.ts` (e outros que usam `ClientProxy`)
-   `src/app.module.ts` (para importar o novo `EventModule`)
