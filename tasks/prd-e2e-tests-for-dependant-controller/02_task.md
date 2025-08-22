---
status: pending
---

<task_context>
<domain>test/e2e</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database, test/infra</dependencies>
</task_context>

# Tarefa 2.0: Implementar Testes E2E para Adição e Listagem de Dependentes

## Overview

Esta tarefa foca em testar os endpoints de criação (`POST /dependants`) e listagem (`GET /dependants`). Os testes devem validar o fluxo de sucesso para adicionar um novo dependente, a validação de dados na entrada e a correta listagem dos dependentes de um usuário.

<import>**MUST READ BEFORE STARTING** @tasks/prd-e2e-tests-for-dependant-controller/_prd.md</import>

<requirements>
- Os testes devem ser adicionados ao arquivo `test/dependant/dependant.e2e-spec.ts`.
- Utilizar as funções do `setup.ts` para preparar o ambiente de cada teste.
- Seguir o padrão Arrange-Act-Assert.
</requirements>

## Subtasks

- [ ] 2.1 Criar o arquivo de suíte de testes `test/dependant/dependant.e2e-spec.ts`.
- [ ] 2.2 Escrever teste para `POST /dependants`: deve adicionar um dependente com sucesso (status 201).
- [ ] 2.3 Escrever teste para `POST /dependants`: não deve adicionar um dependente com dados inválidos (ex: CPF inválido) (status 400).
- [ ] 2.4 Escrever teste para `GET /dependants`: deve listar todos os dependentes do usuário autenticado.
- [ ] 2.5 Escrever teste para `GET /dependants`: deve retornar uma lista vazia para um usuário sem dependentes.

## Implementation Details

Os testes devem usar `supertest` para fazer as requisições HTTP. O `beforeAll` deve configurar a aplicação usando `setupDependantApp`, e o `afterAll` deve chamar `dependantCleanup`. Cada teste deve ser independente.

### Arquivos Relevantes

- `test/dependant/dependant.e2e-spec.ts`

### Dependent Files

- `test/dependant/setup.ts`

## Success Criteria

- Todos os testes para os endpoints `POST /dependants` e `GET /dependants` são implementados e passam com sucesso.
- Os cenários de sucesso e de validação de dados são cobertos.
