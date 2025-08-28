---
status: pending
---

<task_context>
<domain>domain/infraestructure</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 1.0: Criar Interface de Domínio e Implementação de Infraestrutura

## Visão Geral

Esta tarefa estabelece a base da abstração do emissor de eventos. Vamos criar a interface `EventEmitter` no nível de domínio e a estrutura inicial da sua implementação `RabbitMqEventEmitter` na infraestrutura.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>
<import>**MUST READ BEFORE STARTING** @.cursor/rules/folder-structure.mdc</import>

<requirements>
- A interface deve ser agnóstica à tecnologia de mensageria.
- A implementação deve ser preparada para gerenciar múltiplos `ClientProxy`.
</requirements>

## Subtarefas

- [ ] 1.1 Criar o arquivo `src/domain/services/event-emitter.service.ts` com a interface `EventEmitter` e o token de injeção `EVENT_EMITTER`.
- [ ] 1.2 Criar o arquivo `src/infraestructure/services/rabbitmq-event-emitter.service.ts` com a estrutura da classe `RabbitMqEventEmitter`, implementando a nova interface. A implementação dos métodos pode ser deixada com um `// TODO` por enquanto.
- [ ] 1.3 Criar o arquivo de teste `test/infraestructure/services/rabbitmq-event-emitter.e2e-spec.ts` e escrever os testes unitários para a classe `RabbitMqEventEmitter`, mockando os `ClientProxy`.

## Detalhes de Implementação

### `event-emitter.service.ts`
```typescript
export interface EventEmitter {
  emit<T>(service: string, pattern: string, payload: T): void;
}

export const EVENT_EMITTER = Symbol('EVENT_EMITTER');
```

### `rabbitmq-event-emitter.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventEmitter } from '@/domain/services/event-emitter.service';

@Injectable()
export class RabbitMqEventEmitter implements EventEmitter {
  // ... a ser completado na Tarefa 2
}
```

## Critérios de Sucesso

- Os novos arquivos `event-emitter.service.ts` e `rabbitmq-event-emitter.service.ts` foram criados nos diretórios corretos.
- A interface `EventEmitter` e o símbolo `EVENT_EMITTER` estão definidos.
- A classe `RabbitMqEventEmitter` está criada e implementa a interface `EventEmitter`.
- Testes unitários para `RabbitMqEventEmitter` existem e estão passando.
