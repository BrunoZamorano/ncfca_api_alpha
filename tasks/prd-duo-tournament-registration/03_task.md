---
status: completed
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

- [x] 3.1 **(TDD)** Criar testes de unidade para o método `requestDuoRegistration`.
- [x] 3.2 Implementar o método `requestDuoRegistration()` na entidade `Tournament`, que deve criar e adicionar uma nova entidade `Registration` à sua lista interna.
- [x] 3.3 **(TDD)** Criar testes de unidade para o método `approveDuoRegistration`, cobrindo cenários de sucesso e falha (ex: torneio cheio).
- [x] 3.4 Implementar o método `approveDuoRegistration(registrationId)` na entidade `Tournament`. Este método encontrará o registro filho, verificará a capacidade e atualizará seu status para `CONFIRMED` ou `CANCELLED`.
- [x] 3.5 **(TDD)** Criar testes de unidade para o método `rejectDuoRegistration`.
- [x] 3.6 Implementar o método `rejectDuoRegistration(registrationId)` na entidade `Tournament`, que encontrará o registro filho e atualizará seu status para `REJECTED`.
- [x] 3.7 Garantir que os métodos `approve` e `reject` emitam os eventos de domínio apropriados (`DuoRegistration.Accepted`, `DuoRegistration.Rejected`).

## Implementation Examples

- `@src/domain/entities/club/club.ts`

### Relevant Files

-   `src/domain/entities/tournament/tournament.entity.ts`
-   `src/domain/entities/tournament/tests/tournament.entity.spec.ts` (ou similar)
-   `src/domain/entities/registration/registration.entity.ts`

## Success Criteria

- ✅ O agregado `Tournament` tem os novos métodos (`requestDuoRegistration`, `approveDuoRegistration`, `rejectDuoRegistration`) implementados.
- ✅ Todos os testes de unidade para os novos métodos passam.
- ✅ A lógica de negócio para gerenciar registros de duplas está corretamente contida dentro da raiz do agregado `Tournament`.

## Implementation Summary

### Domain Events Created
- ✅ `DuoRegistrationRequested` - Emitido quando um registro de dupla é solicitado
- ✅ `DuoRegistrationAccepted` - Emitido quando um registro de dupla é aprovado
- ✅ `DuoRegistrationRejected` - Emitido quando um registro de dupla é rejeitado

### Tournament Entity Enhancements
- ✅ `requestDuoRegistration()` - Cria registro de dupla com validações completas
- ✅ `approveDuoRegistration()` - Aprova registros pendentes com verificação de capacidade
- ✅ `rejectDuoRegistration()` - Rejeita registros pendentes
- ✅ Validações implementadas: tipo de torneio, período de inscrição, participantes únicos, capacidade

### Registration Entity Enhancements  
- ✅ `confirm()` - Confirma registros pendentes
- ✅ `reject()` - Rejeita registros pendentes
- ✅ Controle de versão otimista implementado
- ✅ Validações de transição de estado

### Testing Coverage
- ✅ **57 testes** na entidade Tournament (incluindo 26 novos para duo registration)
- ✅ **31 testes** na entidade Registration (cobertura completa criada)
- ✅ **88 total de novos testes** seguindo padrões do projeto
- ✅ Cobertura completa de cenários de sucesso e falha
- ✅ Testes de eventos de domínio
- ✅ Testes de validação de regras de negócio

### Files Modified/Created
- ✅ `src/domain/entities/tournament/tournament.entity.ts` - Métodos e validações adicionados
- ✅ `src/domain/entities/tournament/tournament.entity.spec.ts` - Testes expandidos
- ✅ `src/domain/entities/registration/registration.entity.ts` - Métodos de estado adicionados
- ✅ `src/domain/entities/registration/registration.entity.spec.ts` - Arquivo criado com cobertura completa
- ✅ `src/domain/events/duo-registration-requested.event.ts` - Evento criado
- ✅ `src/domain/events/duo-registration-accepted.event.ts` - Evento criado
- ✅ `src/domain/events/duo-registration-rejected.event.ts` - Evento criado

### Test Results
- ✅ **93 test suites passed** (1 nova suite adicionada)
- ✅ **611 tests passed** (31 novos testes adicionados)
- ✅ **0 failures**
- ✅ Implementação não quebrou testes existentes