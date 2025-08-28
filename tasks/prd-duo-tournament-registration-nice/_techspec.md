# Technical Specification: Registro de Duplas em Torneios

## Executive Summary

Esta especificação técnica detalha a arquitetura e o design para a implementação do registro de duplas em torneios. A solução se baseia em um fluxo de convite e aceitação em duas etapas, orquestrado por um novo conjunto de casos de uso e endpoints. A arquitetura seguirá os padrões CQRS e DDD já estabelecidos no projeto. Uma entidade `Registration` gerenciará o estado do convite (de `PENDING` a `CONFIRMED` ou `REJECTED`/`CANCELLED`). A concorrência de inscrições será controlada através de um `optimistic-lock` na entidade `Tournament`. Eventos de domínio (`DuoRegistration.Requested`, `DuoRegistration.Accepted`, etc.) serão emitidos para garantir a extensibilidade e o baixo acoplamento.

## System Architecture

### Domain Placement

- **`src/application/use-cases`**: Novos casos de uso para solicitar, aceitar, recusar e cancelar registros.
- **`src/domain/entities`**: Modificações na entidade `Tournament` e `Registration`.
- **`src/domain/events`**: Novos eventos de domínio para o ciclo de vida do registro de duplas.
- **`src/infraestructure/controllers`**: Novos endpoints no `TournamentController` para expor as funcionalidades.
- **`src/infraestructure/queries`**: Novas queries para consultar status de convites e listar dependentes.
- **`test/`**: Novos testes unitários e E2E para cobrir todos os fluxos.

### Component Overview

- **`TournamentController`**: Orquestra as requisições HTTP, invocando os casos de uso apropriados.
- **Use Cases (Commands)**: `RequestDuoRegistration`, `AcceptDuoRegistration`, `RejectDuoRegistration`, `CancelDuoRegistration`. Cada um conterá a lógica de orquestração para uma ação de escrita.
- **Use Cases (Queries)**: `GetMyPendingRegistrationRequests`, `GetSentRegistrationRequests`, `GetAllDependents`. Responsáveis por buscar dados de forma otimizada.
- **`Tournament` (Aggregate Root)**: A entidade `Tournament` será o agregado principal. Ela conterá o método `duoRegister` que valida as regras de negócio (ex: limite de vagas) e gerencia a coleção de `Registration`. O `optimistic-lock` (`version`) será aplicado aqui.
- **`Registration` (Entity)**: Representa a solicitação de registro de uma dupla, contendo seu status e os participantes. Sua lógica de transição de estado será contida dentro da própria entidade.
- **Domain Events**: `DuoRegistration.Requested`, `DuoRegistration.Accepted`, `DuoRegistration.Rejected`, `DuoRegistration.Cancelled`. Serão emitidos pelos casos de uso para notificar outros partes do sistema de forma assíncrona.

## Implementation Design

### Core Interfaces

```typescript
// src/domain/entities/tournament.entity.ts
export class Tournament extends AggregateRoot {
  // ... existing properties
  
  public duoRegister(requesterId: string, partnerId: string): Registration {
    // 1. Check if tournament is open for registration
    // 2. Check if tournament has available slots
    // 3. Check if requester or partner are already registered
    // 4. Create a new Registration entity with PENDING status
    // 5. Increment competitor count (or pending count)
    // 6. Return the new Registration
  }
}

// src/domain/entities/registration.entity.ts
export class Registration extends AggregateRoot {
    // ... properties

    public accept(): void {
        if (this.status !== RegistrationStatus.PENDING) {
            throw new Error("Only pending registrations can be accepted.");
        }
        this.status = RegistrationStatus.CONFIRMED;
    }

    public reject(): void {
        // Similar logic for rejection
    }

    public cancel(): void {
        // Similar logic for cancellation
    }
}
```

### Data Models

**`prisma/schema.prisma` (adições)**

```prisma
model Tournament {
  // ...
  version Int @default(1) // For optimistic locking
}

model Registration {
  id                  String   @id @default(uuid())
  tournamentId        String
  status              RegistrationStatus @default(PENDING)
  
  requesterDependentId String
  partnerDependentId   String

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  tournament          Tournament @relation(fields: [tournamentId], references: [id])

  @@index([tournamentId])
}

enum RegistrationStatus {
  PENDING
  CONFIRMED
  REJECTED
  CANCELLED
}
```

### API Endpoints

- `GET /tournaments/dependents`: Retorna a lista de todos os dependentes para seleção de parceiro.
- `POST /tournaments/:id/duo-register`: Inicia uma solicitação de registro de dupla.
  - **Body**: `{ "requesterId": "uuid", "partnerId": "uuid" }`
- `GET /tournaments/registrations/pending`: Retorna os convites pendentes para o Holder logado.
- `POST /tournaments/registrations/:registrationId/accept`: Aceita um convite de registro.
- `POST /tournaments/registrations/:registrationId/reject`: Recusa um convite de registro.
- `POST /tournaments/registrations/:registrationId/cancel`: Cancela um convite enviado.

## Impact Analysis

| Affected Component | Type of Impact | Description & Risk Level | Required Action |
|---|---|---|---|
| `tournaments` DB table | Schema Change | Adiciona campo `version`. Baixo risco. | Executar `prisma migrate`. |
| `Registration` DB table | New Table | Nova tabela para gerenciar registros. Baixo risco. | Executar `prisma migrate`. |
| `TournamentController` | Non-breaking | Adiciona novos endpoints. Baixo risco. | N/A. |
| `Tournament` Entity | Behavior Change | Adiciona lógica de registro de dupla. Médio risco. | Testes unitários rigorosos. |

## Testing Approach

### Unit Tests

- **`Tournament` Entity**: Testar o método `duoRegister` em todos os cenários (sucesso, torneio cheio, participante já registrado).
- **`Registration` Entity**: Testar as transições de estado (`accept`, `reject`, `cancel`).
- **Use Cases**: Testar cada caso de uso com mocks para o repositório e a entidade, garantindo que a lógica de orquestração e a emissão de eventos estão corretas.

### Integration Tests

- Criar testes E2E (`test/tournament/duo-registration.e2e-spec.ts`) que simulam o fluxo completo do usuário:
  1. Holder 1 busca a lista de dependentes.
  2. Holder 1 envia um convite para o dependente do Holder 2.
  3. Holder 2 visualiza o convite pendente.
  4. Holder 2 aceita o convite.
  5. Verificar se o status da `Registration` é `CONFIRMED` e se a contagem de vagas no `Tournament` foi atualizada.
- Testar o fluxo de recusa e cancelamento.
- Testar a falha de aceite quando o torneio lota (concorrência).

## Development Sequencing

1.  **Fase 1: Modelo de Dados e Lógica de Domínio**
    - Atualizar o `schema.prisma` com as novas tabelas e campos.
    - Implementar a lógica nos métodos das entidades `Tournament` e `Registration` com testes unitários.
2.  **Fase 2: Fluxo de Solicitação e Descoberta**
    - Criar o caso de uso e o endpoint para `RequestDuoRegistration`.
    - Criar a query e o endpoint para `GetAllDependents`.
3.  **Fase 3: Gerenciamento de Convites**
    - Implementar os casos de uso e endpoints para `AcceptDuoRegistration`, `RejectDuoRegistration` e `CancelDuoRegistration`.
    - Implementar as queries para visualização de convites pendentes e enviados.
4.  **Fase 4: Testes E2E e Finalização**
    - Desenvolver os testes E2E cobrindo todos os cenários.
    - Adicionar os `listeners` para os novos eventos de domínio.

## Monitoring & Observability

- **Metrics**: Adicionar métricas para:
  - `duo_registrations_requested_total`
  - `duo_registrations_confirmed_total`
  - `duo_registrations_rejected_total`
  - `duo_registrations_optimistic_lock_failures_total`
- **Logs**: Adicionar logs detalhados nos casos de uso, especialmente em falhas de validação ou concorrência.

## Technical Considerations

### Key Decisions

- **`Tournament` como Aggregate Root**: A entidade `Tournament` será o agregado para o processo de registro para simplificar o controle de concorrência e a consistência do número de vagas, utilizando seu `version` para o optimistic lock. A `Registration` será tratada como uma entidade filha nesse contexto.
- **Emissão de Eventos**: Eventos de domínio serão emitidos para cancelamento e recusa (`DuoRegistration.Cancelled`, `DuoRegistration.Rejected`) para manter a consistência do padrão arquitetural, mesmo que o PRD não os tenha especificado.

### Known Risks

- **Exposição de Dados em `GetAllDependents`**: O requisito de listar *todos* os dependentes pode ser um risco de privacidade.
  - **Mitigação/Ação**: Na implementação inicial, o endpoint retornará todos os dependentes conforme solicitado. No entanto, uma *issue* será criada para discutir a adição de filtros (ex: por região, por opt-in) em uma iteração futura.
- **Performance da Query de Dependentes**: Conforme a base de usuários cresce, a query `GetAllDependents` pode se tornar lenta.
  - **Mitigação**: A query será implementada usando um `QueryHandler` de CQRS, que pode ser otimizado para ler de uma réplica ou usar projeções de leitura se necessário no futuro.

### Standards Compliance

- A implementação seguirá estritamente os padrões definidos em `.cursor/rules/`, incluindo `architecture.mdc`, `code-standards.mdc` e `tests-standards.mdc`.
- O padrão CQRS, o uso de eventos de domínio e a separação de camadas (domínio, aplicação, infraestrutura) serão respeitados.
