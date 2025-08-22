---
status: completed
---

<task_context>
<domain>test/training</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database,http_server</dependencies>
</task_context>

# Tarefa 5.0: Implementar Testes E2E para Deleção de Treinamentos (DELETE /trainings/:id)

## Visão Geral

Esta tarefa finaliza a suíte de testes com a criação do arquivo `delete-training.e2e-spec.ts` para validar o endpoint `DELETE /trainings/:id`. Os testes devem cobrir o cenário de sucesso, as regras de autorização e o tratamento de IDs inexistentes.

<import>**DEVE LER ANTES DE INICIAR** @.cursor/rules/tests-standards.mdc</import>

<requirements>
- O arquivo deve ser criado em `test/training/delete-training.e2e-spec.ts`.
- Deve utilizar o `setup.ts` para criar um treinamento que será deletado durante o teste.
- Deve seguir o padrão Arrange-Act-Assert (AAA).
</requirements>

## Subtarefas

- [x] 5.1: Criar a estrutura do arquivo de teste com `beforeAll` e `afterAll`.
- [x] 5.2: Implementar teste de sucesso para um `ADMIN` deletando um treinamento existente, esperando `204 No Content`.
- [x] 5.3: Implementar teste de falha de autorização para `DONO_DE_CLUBE`, esperando `403 Forbidden`.
- [x] 5.4: Implementar teste de falha para um `ADMIN` tentando deletar um treinamento com `id` inexistente, esperando `404 Not Found`.
- [x] 5.5: Implementar teste de falha de autenticação para uma requisição sem token, esperando `401 Unauthorized`.

## Detalhes da Implementação

Os testes devem validar os seguintes requisitos do PRD:

- **R5.1 (Sucesso):** Um usuário `ADMIN` deve conseguir deletar um treinamento existente.
- **R5.2 (Falha - Autorização):** Um usuário `DONO_DE_CLUBE` não deve conseguir deletar.
- **R5.3 (Falha - Não Encontrado):** Uma tentativa de deleção para um `id` inexistente deve retornar `404 Not Found`.
- **R5.4 (Falha - Autenticação):** Uma requisição sem token deve receber `401 Unauthorized`.

### Arquivos Relevantes

- `test/training/delete-training.e2e-spec.ts` (Arquivo a ser criado)

### Arquivos Dependentes

- `test/training/setup.ts`

## Critérios de Sucesso

- O arquivo de teste é criado e todos os testes passam com sucesso.
- Os cenários de sucesso, autorização e erro para `DELETE /trainings/:id` são devidamente cobertos.
- A limpeza de dados no `afterAll` remove todos os artefatos de teste.
