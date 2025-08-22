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

# Tarefa 3.0: Implementar Testes E2E para Visualização de Família e Dependente

## Overview

Esta tarefa cobre os testes para os endpoints de visualização: `GET /dependants/my-family` e `GET /dependants/:id`. O foco é garantir que um usuário possa ver seus próprios dados familiares e de dependentes, mas não os de outros usuários.

<import>**MUST READ BEFORE STARTING** @tasks/prd-e2e-tests-for-dependant-controller/_prd.md</import>

<requirements>
- Os testes devem ser adicionados ao arquivo `test/dependant/dependant.e2e-spec.ts`.
- Utilizar as funções do `setup.ts` para preparar o ambiente de cada teste.
- Testar cenários de sucesso, erro (não encontrado) e autorização.
</requirements>

## Subtasks

- [ ] 3.1 Escrever teste para `GET /dependants/my-family`: deve retornar os dados da família do usuário autenticado.
- [ ] 3.2 Escrever teste para `GET /dependants/:id`: deve retornar os dados de um dependente específico.
- [ ] 3.3 Escrever teste para `GET /dependants/:id`: deve retornar erro 404 se o dependente não existir.
- [ ] 3.4 Escrever teste para `GET /dependants/:id`: deve retornar erro 403 se o dependente pertencer a outra família.

## Implementation Details

Para o teste de autorização (3.4), será necessário criar dois usuários diferentes e tentar acessar o dependente de um com o token do outro.

### Arquivos Relevantes

- `test/dependant/dependant.e2e-spec.ts`

### Dependent Files

- `test/dependant/setup.ts`

## Success Criteria

- Todos os testes para os endpoints `GET /dependants/my-family` e `GET /dependants/:id` são implementados e passam com sucesso.
- Os cenários de sucesso, não encontrado e de falha de autorização são cobertos.
