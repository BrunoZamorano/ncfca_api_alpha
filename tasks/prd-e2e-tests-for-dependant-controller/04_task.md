---
status: pending
---

<task_context>
<domain>test/e2e</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database, test/infra</dependencies>
</task_context>

# Tarefa 4.0: Implementar Testes E2E para Atualização de Dependentes

## Overview

Esta tarefa foca em validar o endpoint de atualização, `PATCH /dependants/:id`. Os testes devem garantir que um usuário pode atualizar seus próprios dependentes, que a validação de dados é aplicada e que as regras de autorização são respeitadas.

<import>**MUST READ BEFORE STARTING** @tasks/prd-e2e-tests-for-dependant-controller/_prd.md</import>

<requirements>
- Os testes devem ser adicionados ao arquivo `test/dependant/dependant.e2e-spec.ts`.
- Utilizar as funções do `setup.ts` para preparar o ambiente de cada teste.
- Cobrir cenários de sucesso, validação, não encontrado e autorização.
</requirements>

## Subtasks

- [ ] 4.1 Escrever teste para `PATCH /dependants/:id`: deve atualizar os dados de um dependente com sucesso (status 204).
- [ ] 4.2 Escrever teste para `PATCH /dependants/:id`: não deve atualizar com dados inválidos (status 400).
- [ ] 4.3 Escrever teste para `PATCH /dependants/:id`: deve retornar erro 404 se o dependente não existir.
- [ ] 4.4 Escrever teste para `PATCH /dependants/:id`: deve retornar erro 403 se o dependente pertencer a outra família.

## Implementation Details

Similar ao teste de visualização, o cenário de autorização (4.4) exigirá a criação de dois usuários para garantir o isolamento dos dados.

### Arquivos Relevantes

- `test/dependant/dependant.e2e-spec.ts`

### Dependent Files

- `test/dependant/setup.ts`

## Success Criteria

- Todos os testes para o endpoint `PATCH /dependants/:id` são implementados e passam com sucesso.
- Os cenários de sucesso, validação, não encontrado e de falha de autorização são cobertos.
