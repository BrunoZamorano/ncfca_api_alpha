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

# Tarefa 4.0: Implementar Testes E2E para Atualização de Treinamentos (PUT /trainings/:id)

## Visão Geral

Esta tarefa consiste em criar o arquivo `update-training.e2e-spec.ts` para validar o endpoint `PUT /trainings/:id`. Os testes devem abranger o cenário de sucesso, regras de autorização, tratamento de ID inexistente (Not Found) e validação de dados.

<import>**DEVE LER ANTES DE INICIAR** @.cursor/rules/tests-standards.mdc</import>

<requirements>
- O arquivo deve ser criado em `test/training/update-training.e2e-spec.ts`.
- Deve utilizar o `setup.ts` para criar os dados necessários, incluindo um treinamento pré-existente para ser atualizado.
- Deve seguir o padrão Arrange-Act-Assert (AAA).
</requirements>

## Subtarefas

- [x] 4.0 Implementar Testes E2E para Atualização de Treinamentos (PUT /trainings/:id) ✅ COMPLETED
  - [x] 4.1: Criar a estrutura do arquivo de teste com `beforeAll` e `afterAll`.
  - [x] 4.2: Implementar teste de sucesso para um `ADMIN` atualizando um treinamento existente, esperando `200 OK`.
  - [x] 4.3: Implementar teste de falha de autorização para `DONO_DE_CLUBE`, esperando `403 Forbidden`.
  - [x] 4.4: Implementar teste de falha para um `ADMIN` tentando atualizar um treinamento com `id` inexistente, esperando `404 Not Found`.
  - [x] 4.5: Implementar teste de falha de validação para um `ADMIN` com dados inválidos (ex: `youtubeUrl` malformado), esperando `400 Bad Request`.
  - [x] 4.6: Implementar teste de falha de autenticação para uma requisição sem token, esperando `401 Unauthorized`.
  - [x] 4.7: Task definition, PRD, and tech spec validated
  - [x] 4.8: Rules analysis and compliance verified
  - [x] 4.9: Code review completed with Zen MCP
  - [x] 4.10: Ready for deployment

## Detalhes da Implementação

Os testes devem validar os seguintes requisitos do PRD:

- **R4.1 (Sucesso):** Um usuário `ADMIN` deve conseguir atualizar um treinamento existente.
- **R4.2 (Falha - Autorização):** Um usuário `DONO_DE_CLUBE` não deve conseguir atualizar.
- **R4.3 (Falha - Não Encontrado):** Uma tentativa de atualização para um `id` inexistente deve retornar `404 Not Found`.
- **R4.4 (Falha - Validação):** Uma requisição com dados inválidos deve ser rejeitada.
- **R4.5 (Falha - Autenticação):** Uma requisição sem token deve receber `401 Unauthorized`.

### Arquivos Relevantes

- `test/training/update-training.e2e-spec.ts` (Arquivo a ser criado)

### Arquivos Dependentes

- `test/training/setup.ts`

## Critérios de Sucesso

- O arquivo de teste é criado e todos os testes passam.
- Os cenários de sucesso, autorização, validação e erro (Not Found) para `PUT /trainings/:id` são cobertos.
- A limpeza de dados no `afterAll` funciona corretamente.
