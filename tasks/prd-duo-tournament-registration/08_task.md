---
status: pending
---

<task_context>
<domain>testing</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>application/use-cases, infraestructure/controllers</dependencies>
</task_context>

# Task 8.0: Implement End-to-End (E2E) Tests

## Overview

Esta tarefa final é criar um conjunto abrangente de testes end-to-end para garantir que toda a funcionalidade de registro de duplas funcione como um todo. Esses testes são vitais para verificar as interações entre os diferentes componentes e garantir a robustez do sistema.

<import>**MUST READ BEFORE STARTING** @.cursor/rules/tests-standards.mdc</import>

<requirements>
- Os testes devem cobrir o "caminho feliz" completo.
- Os testes devem cobrir cenários de falha e casos extremos.
- Um teste específico deve ser criado para validar a prevenção de condição de corrida pelo travamento otimista.
</requirements>

## Subtasks

- [ ] 8.1 Criar um novo arquivo de teste: `test/tournament/duo-registration.e2e-spec.ts`.
- [ ] 8.2 Implementar o teste E2E para o "caminho feliz" completo: solicitar -> obter pendentes -> aceitar.
- [ ] 8.3 Implementar o teste E2E para rejeitar uma solicitação.
- [ ] 8.4 Implementar o teste E2E para tentar aceitar uma solicitação para um torneio que ficou cheio após o convite ser enviado.
- [ ] 8.5 Implementar o teste E2E crítico para simular a condição de corrida do "último lugar" para verificar se o travamento otimista funciona.

## Implementation Examples

- `@test/club-request/approve-club-request.e2e-spec.ts`

### Relevant Files

-   `test/tournament/duo-registration.e2e-spec.ts`
-   Utilitários de teste em `test/utils/`

## Success Criteria

- Todos os testes E2E passam de forma consistente.
- O teste de condição de corrida demonstra com sucesso que o travamento otimista está funcionando.
- A cobertura de teste para o novo fluxo é alta.
