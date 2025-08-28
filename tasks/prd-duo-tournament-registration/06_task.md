---
status: pending
---

<task_context>
<domain>application/use-cases</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>domain/entities, infraestructure/database</dependencies>
</task_context>

# Task 6.0: Implement Accept Duo Registration Workflow

## Overview

Esta tarefa implementa o caso de uso para aceitar um convite de dupla. O caso de uso irá carregar a raiz do agregado `Tournament`, invocar a lógica de aprovação e persistir o estado alterado, tudo dentro de uma transação.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- O caso de uso deve carregar o agregado `Tournament` completo.
- A lógica de aceitação deve ser transacional, salvando o agregado `Tournament` atualizado e um novo `RegistrationSync`.
- O travamento otimista (`version`) deve ser usado para prevenir over-booking.
</requirements>

## Subtasks

- [ ] 6.1 Criar o `AcceptDuoRegistrationCommand` (`registrationId`, `userId`).
- [ ] 6.2 Criar testes de unidade para o `AcceptDuoRegistrationUseCase`, incluindo cenários de falha de travamento otimista.
- [ ] 6.3 Implementar o `AcceptDuoRegistrationUseCase`, garantindo que ele carregue o agregado `Tournament` a partir do `registrationId`.
- [ ] 6.4 O caso de uso deve chamar o método `tournament.approveDuoRegistration(registrationId)`.
- [ ] 6.5 Garantir que o caso de uso use uma transação para salvar o agregado `Tournament` atualizado e o novo registro `RegistrationSync`.
- [ ] 6.6 Adicionar o endpoint `POST /registrations/:id/accept` ao controller apropriado.

## Implementation Examples

- `@src/application/use-cases/club-request/approve-club-request/approve-club-request.use-case.ts`

### Relevant Files

-   `src/application/use-cases/tournaments/accept-duo-registration.use-case.ts`
-   `src/infraestructure/controllers/registration.controller.ts` (ou `tournament.controller.ts`)
-   `src/domain/entities/tournament/tournament.entity.ts`

## Success Criteria

- O caso de uso `AcceptDuoRegistration` é implementado e passa em todos os testes de unidade.
- O endpoint da API funciona e aceita com sucesso um registro pendente.
- O sistema previne corretamente o registro se o torneio estiver cheio.
- Falhas de travamento otimista são tratadas graciosamente.