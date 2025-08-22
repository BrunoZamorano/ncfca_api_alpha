---
status: completed
---

<task_context>
<domain>test/training</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database,http_server</dependencies>
</task_context>

# Tarefa 3.0: Implementar Testes E2E para Criação de Treinamentos (POST /trainings)

## Visão Geral

O objetivo desta tarefa é criar o arquivo `create-training.e2e-spec.ts` para testar o endpoint `POST /trainings`. Os testes devem validar o cenário de sucesso, as regras de autorização e a validação dos dados de entrada.

<import>**DEVE LER ANTES DE INICIAR** @.cursor/rules/tests-standards.mdc</import>

<requirements>
- O arquivo deve ser criado em `test/training/create-training.e2e-spec.ts`.
- Deve utilizar o módulo `setup.ts` para preparação e limpeza do ambiente.
- Deve seguir o padrão Arrange-Act-Assert (AAA).
- Os testes de validação devem cobrir os campos obrigatórios e formatos esperados.
</requirements>

## Subtarefas

- [x] 3.1: Criar a estrutura do arquivo de teste com `beforeAll` e `afterAll` a partir do `setup.ts`. ✅ COMPLETED
- [x] 3.2: Implementar teste de sucesso para um `ADMIN` criando um treinamento com dados válidos, esperando `201 Created` e o retorno dos dados criados. ✅ COMPLETED
- [x] 3.3: Implementar teste de falha de autorização para `DONO_DE_CLUBE`, esperando `403 Forbidden`. ✅ COMPLETED
- [x] 3.4: Implementar teste de falha de validação para um `ADMIN` com dados inválidos (ex: `title` em branco), esperando `400 Bad Request`. ✅ COMPLETED
- [x] 3.5: Implementar teste de falha de autenticação para uma requisição sem token, esperando `401 Unauthorized`. ✅ COMPLETED

## Conclusão

- [x] 3.0 Implementar Testes E2E para Criação de Treinamentos (POST /trainings) ✅ COMPLETED
  - [x] 3.1 Estrutura do arquivo de teste implementada
  - [x] 3.2 Teste de sucesso para ADMIN implementado
  - [x] 3.3 Teste de autorização implementado
  - [x] 3.4 Teste de validação implementado  
  - [x] 3.5 Teste de autenticação implementado
  - [x] 3.6 Task definition, PRD, e tech spec validados
  - [x] 3.7 Análise de regras e conformidade verificada
  - [x] 3.8 Code review completo com Zen MCP
  - [x] 3.9 Pronto para deploy

## Detalhes da Implementação

Os testes devem validar os seguintes requisitos do PRD:

- **R3.1 (Sucesso):** Um usuário `ADMIN` deve conseguir criar um novo treinamento com dados válidos.
- **R3.2 (Falha - Autorização):** Um usuário `DONO_DE_CLUBE` não deve conseguir criar um treinamento.
- **R3.3 (Falha - Validação):** Uma requisição de um `ADMIN` com dados inválidos deve ser rejeitada.
- **R3.4 (Falha - Autenticação):** Uma requisição sem token deve receber `401 Unauthorized`.

### Arquivos Relevantes

- `test/training/create-training.e2e-spec.ts` (Arquivo a ser criado)

### Arquivos Dependentes

- `test/training/setup.ts`

## Critérios de Sucesso

- O arquivo de teste é criado e todos os testes passam.
- Os cenários de sucesso, autorização e validação para `POST /trainings` são cobertos.
- Os dados criados durante o teste são removidos com sucesso pelo `afterAll`.
