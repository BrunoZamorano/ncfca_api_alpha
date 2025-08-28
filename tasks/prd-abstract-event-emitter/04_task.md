---
status: pending
---

<task_context>
<domain>application/shared</domain>
<type>refactoring</type>
<scope>integration</scope>
<complexity>high</complexity>
<dependencies>1.0, 2.0, 3.0</dependencies>
</task_context>

# Tarefa 4.0: Refatorar Módulos e Serviços Existentes

## Visão Geral

Com a nova abstração no lugar, esta tarefa final consiste em refatorar o código existente para utilizá-la. Vamos remover as configurações antigas dos módulos de feature e atualizar os serviços para usar a interface `EventEmitter` em vez do `ClientProxy` diretamente.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>
<import>**MUST READ BEFORE STARTING** @.cursor/rules/tests-standards.mdc</import>

<requirements>
- As dependências diretas do `ClientsModule` e `ClientProxy` devem ser removidas dos módulos e serviços de feature.
- A nova interface `EventEmitter` deve ser usada para todas as emissões de eventos.
- Os testes E2E devem passar para garantir que a funcionalidade não foi quebrada.
</requirements>

## Subtarefas

- [ ] 4.1 Em `src/shared/modules/club-request.module.ts`, remover a configuração do `ClientsModule` e o `exports` do `ClientsModule`. Adicionar `EventModule` aos `imports`.
- [ ] 4.2 Em `src/shared/modules/tournament.module.ts`, remover a configuração do `ClientsModule` e o `exports` do `ClientsModule`. Adicionar `EventModule` aos `imports`.
- [ ] 4.3 Percorrer a base de código em busca de injeções dos tokens `CLUB_EVENTS_SERVICE` e `TOURNAMENT_EVENTS_SERVICE`. Substituir a injeção do `ClientProxy` pela injeção do `EVENT_EMITTER`.
- [ ] 4.4 Atualizar o código que usava `this.client.emit(...)` para usar `this.eventEmitter.emit(SERVICE_NAME, ...)`.
- [ ] 4.5 Rodar os testes E2E relacionados a `club-request` e `tournament` para validar que a comunicação via RabbitMQ continua funcionando corretamente após a refatoração.

## Detalhes de Implementação

### Exemplo de Refatoração de um Serviço

**Antes:**
```typescript
// Em um listener ou serviço
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/service-constants';

@Injectable()
export class PublishIntegrationEventOnRegistrationConfirmed {
  constructor(@Inject(TOURNAMENT_EVENTS_SERVICE) private readonly client: ClientProxy) {}

  handleEvent(event: any): void {
    this.client.emit('registration.confirmed', event);
  }
}
```

**Depois:**
```typescript
// Em um listener ou serviço
import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter, EVENT_EMITTER } from '@/domain/services/event-emitter.service';
import { TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/service-constants';

@Injectable()
export class PublishIntegrationEventOnRegistrationConfirmed {
  constructor(@Inject(EVENT_EMITTER) private readonly eventEmitter: EventEmitter) {}

  handleEvent(event: any): void {
    this.eventEmitter.emit(TOURNAMENT_EVENTS_SERVICE, 'registration.confirmed', event);
  }
}
```

## Critérios de Sucesso

- Os módulos `ClubRequestModule` e `TournamentModule` foram limpos e agora importam `EventModule`.
- Todos os usos de `ClientProxy` foram substituídos pela nova abstração `EventEmitter`.
- A aplicação compila e todos os testes (unitários e E2E) passam com sucesso.
- A funcionalidade de criação de clube e registro em torneio foi testada manualmente (se aplicável) e funciona como esperado.
