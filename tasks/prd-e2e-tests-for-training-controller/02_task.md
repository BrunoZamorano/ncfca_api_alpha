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

# Tarefa 2.0: Implementar Testes E2E para Listagem de Treinamentos (GET /trainings)

## Visão Geral

Esta tarefa foca na criação do arquivo de teste `list-trainings.e2e-spec.ts` para validar o endpoint `GET /trainings`. Os testes devem cobrir cenários de sucesso para usuários autorizados e cenários de falha para controle de acesso (autorização e autenticação).

<import>**DEVE LER ANTES DE INICIAR** @.cursor/rules/tests-standards.mdc</import>

<requirements>
- O arquivo deve ser criado em `test/training/list-trainings.e2e-spec.ts`.
- Deve utilizar o módulo `setup.ts` para preparação e limpeza do ambiente.
- Deve seguir o padrão Arrange-Act-Assert (AAA).
- Os nomes dos testes devem seguir o padrão "Deve..." ou "Não deve...".
</requirements>

## Subtarefas

- [ ] 2.1: Criar a estrutura básica do arquivo de teste, incluindo `beforeAll` para setup e `afterAll` para cleanup, utilizando as funções de `setup.ts`.
- [ ] 2.2: Implementar teste de sucesso para um usuário `ADMIN`, verificando se a resposta é `200 OK` e se os dados retornados estão corretos.
- [ ] 2.3: Implementar teste de sucesso para um usuário `DONO_DE_CLUBE`, verificando se a resposta é `200 OK`.
- [ ] 2.4: Implementar teste de falha de autorização para um usuário `SEM_FUNCAO`, esperando uma resposta `403 Forbidden`.
- [ ] 2.5: Implementar teste de falha de autenticação para uma requisição sem token, esperando uma resposta `401 Unauthorized`.

## Detalhes da Implementação

Os testes devem validar os seguintes requisitos do PRD:

- **R2.1 (Sucesso):** Um usuário com a role `ADMIN` deve conseguir listar todos os treinamentos.
- **R2.2 (Sucesso):** Um usuário com a role `DONO_DE_CLUBE` deve conseguir listar todos os treinamentos.
- **R2.3 (Falha - Autorização):** Um usuário sem as roles necessárias deve receber `403 Forbidden`.
- **R2.4 (Falha - Autenticação):** Uma requisição sem token deve receber `401 Unauthorized`.

### Arquivos Relevantes

- `test/training/list-trainings.e2e-spec.ts` (Arquivo a ser criado)

### Arquivos Dependentes

- `test/training/setup.ts`

## Critérios de Sucesso

- O arquivo de teste é criado e todos os testes passam com sucesso.
- Os testes cobrem adequadamente os cenários de sucesso e de falha de controle de acesso para o endpoint `GET /trainings`.
- O teste de limpeza (`afterAll`) é executado corretamente, não deixando dados órfãos.
