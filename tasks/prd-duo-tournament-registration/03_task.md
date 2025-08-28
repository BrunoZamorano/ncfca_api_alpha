---
status: pending
---

<task_context>
<domain>domain/entities</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>domain/entities</dependencies>
</task_context>

# Task 3.0: Enhance Tournament Aggregate with Duo Registration Management

## Overview

Esta tarefa envolve aprimorar o agregado `Tournament` para que ele possa gerenciar todo o ciclo de vida dos registros de duplas, reforçando seu papel como raiz do agregado. Novos métodos para solicitar, aprovar e rejeitar registros de duplas serão adicionados, garantindo a consistência transacional.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- Toda a lógica de mudança de estado para `Registration` deve ser encapsulada dentro do agregado `Tournament`.
- A abordagem de Desenvolvimento Guiado por Testes (TDD) deve ser usada.
- Os métodos devem validar todas as regras de negócio relevantes e garantir a consistência dentro do limite do agregado.
</requirements>

## Subtasks

- [ ] 3.1 **(TDD)** Criar testes de unidade para o método `requestDuoRegistration`.
- [ ] 3.2 Implementar o método `requestDuoRegistration()` na entidade `Tournament`, que deve criar e adicionar uma nova entidade `Registration` à sua lista interna.
- [ ] 3.3 **(TDD)** Criar testes de unidade para o método `approveDuoRegistration`, cobrindo cenários de sucesso e falha (ex: torneio cheio).
- [ ] 3.4 Implementar o método `approveDuoRegistration(registrationId)` na entidade `Tournament`. Este método encontrará o registro filho, verificará a capacidade e atualizará seu status para `CONFIRMED` ou `CANCELLED`.
- [ ] 3.5 **(TDD)** Criar testes de unidade para o método `rejectDuoRegistration`.
- [ ] 3.6 Implementar o método `rejectDuoRegistration(registrationId)` na entidade `Tournament`, que encontrará o registro filho e atualizará seu status para `REJECTED`.
- [ ] 3.7 Garantir que os métodos `approve` e `reject` emitam os eventos de domínio apropriados (`DuoRegistration.Accepted`, `DuoRegistration.Rejected`).

## Implementation Examples

- `@src/domain/entities/club/club.ts`

### Relevant Files

-   `src/domain/entities/tournament/tournament.entity.ts`
-   `src/domain/entities/tournament/tests/tournament.entity.spec.ts` (ou similar)
-   `src/domain/entities/registration/registration.entity.ts`

## Success Criteria

- O agregado `Tournament` tem os novos métodos (`requestDuoRegistration`, `approveDuoRegistration`, `rejectDuoRegistration`) implementados.
- Todos os testes de unidade para os novos métodos passam.
- A lógica de negócio para gerenciar registros de duplas está corretamente contida dentro da raiz do agregado `Tournament`.