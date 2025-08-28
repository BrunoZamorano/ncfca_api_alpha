---
status: pending
---

<task_context>
<domain>infraestructure/listeners</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>application/use-cases, domain/events</dependencies>
</task_context>

# Task 9.0: Implement Registration Confirmation Listener

## Overview

Após uma solicitação de dupla ser aceita (`DuoRegistration.Accepted`), um processo de confirmação subsequente precisa ser acionado. Esta tarefa envolve a criação de um listener de eventos para lidar com isso de forma assíncrona, orquestrando a confirmação final do registro através de um novo caso de uso.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/code-standards.mdc</import>

<requirements>
- Um novo listener deve ser criado para se inscrever no evento `DuoRegistration.Accepted`.
- Um novo caso de uso, `ConfirmDuoRegistrationUseCase`, deve ser criado para encapsular a lógica de confirmação.
- O listener deve invocar o caso de uso para processar o evento.
</s_requirements>

## Subtasks

- [ ] 9.1 Definir o evento `DuoRegistration.Accepted` em `src/domain/events/` se ele ainda não existir.
- [ ] 9.2 Criar um novo listener, `DuoRegistrationAcceptedListener`, em `src/infraestructure/listeners/`.
- [ ] 9.3 **(TDD)** Criar testes de unidade para um novo `ConfirmDuoRegistrationUseCase` em `src/application/use-cases/tournaments/confirm-registration/`.
- [ ] 9.4 Implementar o `ConfirmDuoRegistrationUseCase`, que conterá a lógica para finalizar o registro.
- [ ] 9.5 Integrar e invocar o `ConfirmDuoRegistrationUseCase` de dentro do `DuoRegistrationAcceptedListener`.
- [ ] 9.6 Registrar o novo listener no `TournamentModule` ou `EventModule` para garantir que ele seja ativado.

## Implementation Examples

Atualmente, não há listeners de eventos na base de código para usar como referência direta. No entanto, o projeto usa o `EventEmitterModule` do NestJS. Você deve seguir a documentação oficial do NestJS sobre eventos.

-   **Registro do Módulo de Eventos:** `@src/app.module.ts`
-   **Módulo de Eventos Customizado (para emissores):** `@src/shared/modules/event.module.ts`

### Relevant Files

-   `src/domain/events/duo-registration-accepted.event.ts`
-   `src/infraestructure/listeners/duo-registration-accepted.listener.ts`
-   `src/application/use-cases/tournaments/confirm-registration/confirm-duo-registration.use-case.ts`
-   `src/shared/modules/tournament.module.ts`
-   `src/shared/modules/event.module.ts`

## Success Criteria

- O listener de eventos é acionado com sucesso quando um evento `DuoRegistration.Accepted` é emitido.
- O `ConfirmDuoRegistrationUseCase` é executado e processa a lógica de confirmação com sucesso.
- O fluxo geral é assíncrono e desacoplado do processo de aceitação inicial.
