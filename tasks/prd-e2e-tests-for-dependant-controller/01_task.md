---
status: pending
---

<task_context>
<domain>test/infra</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 1.0: Implementar a Infraestrutura de Teste para Dependentes (setup.ts)

## Overview

Esta tarefa consiste em criar o arquivo `setup.ts` no diretório `test/dependant`, que conterá todas as funções utilitárias necessárias para a suíte de testes E2E do `DependantController`. Isso inclui a inicialização do ambiente de teste, criação de entidades (usuários, famílias, dependentes) e a limpeza do banco de dados após a execução dos testes.

<import>**MUST READ BEFORE STARTING** @test/club-management/README.md</import>

<requirements>
- O arquivo deve ser criado em `test/dependant/setup.ts`.
- Deve seguir o padrão estabelecido em `test/club-management/setup.ts`.
- A função de cleanup deve ser "cirúrgica", removendo apenas os dados criados nos testes.
</requirements>

## Subtasks

- [ ] 1.1 Criar o arquivo `test/dependant/setup.ts`.
- [ ] 1.2 Implementar a função `setupDependantApp` para inicializar o `TestingModule` do NestJS.
- [ ] 1.3 Implementar a função `createRegularUser` que cria um usuário padrão com uma família e afiliação ativas.
- [ ] 1.4 Implementar a função `createTestDependant` para adicionar um dependente a uma família existente.
- [ ] 1.5 Implementar a função `dependantCleanup` para remover todos os dados de teste criados.

## Implementation Details

Conforme especificado no `_techspec.md`, as funções devem encapsular a lógica de interação com o Prisma para criar e remover dados, e com o NestJS para inicializar a aplicação de teste. A afiliação do usuário deve ser válida (não expirada) para que ele seja considerado um usuário ativo.

### Arquivos Relevantes

- `test/dependant/setup.ts`

### Dependent Files

- `test/dependant/dependant.e2e-spec.ts` (dependerá deste setup)

## Success Criteria

- O arquivo `setup.ts` é criado com todas as funções necessárias implementadas.
- As funções são capazes de preparar o ambiente de teste e limpá-lo corretamente após a execução.
