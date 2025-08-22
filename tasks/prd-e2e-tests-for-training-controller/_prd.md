# Product Requirements Document (PRD): Suíte de Testes E2E para TrainingController

## Overview

Este documento descreve os requisitos para a criação de uma suíte de testes End-to-End (E2E) abrangente para o `TrainingController`. O objetivo é garantir a robustez, a segurança e o funcionamento correto de todas as funcionalidades relacionadas a treinamentos, mitigando o risco de regressões futuras. A nova suíte de testes seguirá rigorosamente os padrões e a arquitetura já estabelecidos no módulo `club-management`, conforme documentado em `test/club-management/README.md`.

## Goals

- **Garantir a Qualidade:** Assegurar que todas as rotas do `TrainingController` (`GET`, `POST`, `PUT`, `DELETE`) funcionem conforme o esperado em cenários de sucesso e falha.
- **Validar Segurança:** Verificar se as regras de controle de acesso baseadas em papéis (`UserRoles`) estão sendo aplicadas corretamente para cada endpoint.
- **Manter Padrões:** Implementar a suíte de testes em conformidade com as convenções de nomenclatura, estrutura (setup, AAA) e limpeza de dados do projeto.
- **Prevenir Regressões:** Criar uma rede de segurança automatizada que detecte quebras de funcionalidade introduzidas por futuras alterações no código.

## Core Features

A suíte de testes E2E deverá cobrir os seguintes cenários para o `TrainingController`:

### 1. Estrutura de Testes (`test/training/`)

- **`setup.ts`:**
    - **R1.1:** Deve exportar uma função `setupTrainingApp` que inicializa um `TestingModule` com todos os módulos e provedores necessários.
    - **R1.2:** Deve fornecer funções utilitárias para criar usuários com diferentes papéis (`createAdminUser`, `createClubOwnerUser`, `createRegularUser`), garantindo que suas famílias tenham afiliação ativa.
    - **R1.3:** Deve incluir uma função `createTestTraining` para popular o banco de dados com dados de treinamento para os testes.
    - **R1.4:** Deve implementar uma função de limpeza `trainingCleanup` que realize a exclusão cirúrgica de todos os dados criados durante os testes (usuários, famílias, treinamentos, etc.), recebendo uma lista de `userIds` como parâmetro.

- **`training.e2e-spec.ts`:**
    - **R1.5:** O arquivo de teste principal para as funcionalidades do `TrainingController`.

### 2. Testes para `GET /trainings`

- **R2.1 (Sucesso):** Um usuário com a role `ADMIN` deve conseguir listar todos os treinamentos e receber um status `200 OK`.
- **R2.2 (Sucesso):** Um usuário com a role `DONO_DE_CLUBE` deve conseguir listar todos os treinamentos e receber um status `200 OK`.
- **R2.3 (Falha - Autorização):** Um usuário sem as roles necessárias (ex: `SEM_FUNCAO`) deve receber um status `403 Forbidden`.
- **R2.4 (Falha - Autenticação):** Uma requisição sem token de autenticação deve receber um status `401 Unauthorized`.

### 3. Testes para `POST /trainings`

- **R3.1 (Sucesso):** Um usuário `ADMIN` deve conseguir criar um novo treinamento com dados válidos e receber um status `201 Created` com os dados do treinamento criado.
- **R3.2 (Falha - Autorização):** Um usuário `DONO_DE_CLUBE` não deve conseguir criar um treinamento, recebendo um status `403 Forbidden`.
- **R3.3 (Falha - Validação):** Uma requisição de um `ADMIN` com dados inválidos (ex: `title` em branco) deve ser rejeitada com um status `400 Bad Request`.
- **R3.4 (Falha - Autenticação):** Uma requisição sem token de autenticação deve receber um status `401 Unauthorized`.

### 4. Testes para `PUT /trainings/:id`

- **R4.1 (Sucesso):** Um usuário `ADMIN` deve conseguir atualizar um treinamento existente com dados válidos e receber um status `200 OK`.
- **R4.2 (Falha - Autorização):** Um usuário `DONO_DE_CLUBE` não deve conseguir atualizar um treinamento, recebendo um status `403 Forbidden`.
- **R4.3 (Falha - Não Encontrado):** Uma tentativa de atualização por um `ADMIN` para um `id` de treinamento inexistente deve retornar `404 Not Found`.
- **R4.4 (Falha - Validação):** Uma requisição de um `ADMIN` com dados inválidos (ex: `youtubeUrl` malformado) deve ser rejeitada com um status `400 Bad Request`.
- **R4.5 (Falha - Autenticação):** Uma requisição sem token de autenticação deve receber um status `401 Unauthorized`.

### 5. Testes para `DELETE /trainings/:id`

- **R5.1 (Sucesso):** Um usuário `ADMIN` deve conseguir deletar um treinamento existente e receber um status `204 No Content`.
- **R5.2 (Falha - Autorização):** Um usuário `DONO_DE_CLUBE` não deve conseguir deletar um treinamento, recebendo um status `403 Forbidden`.
- **R5.3 (Falha - Não Encontrado):** Uma tentativa de deleção por um `ADMIN` para um `id` de treinamento inexistente deve retornar `404 Not Found`.
- **R5.4 (Falha - Autenticação):** Uma requisição sem token de autenticação deve receber um status `401 Unauthorized`.

## High-Level Technical Constraints

- A suíte de testes deve ser executada usando o `jest-e2e.json`.
- Os testes devem interagir com a aplicação através de requisições HTTP (`supertest`).
- A limpeza do banco de dados deve ser "cirúrgica", evitando o uso de `TRUNCATE` ou a limpeza completa do banco para garantir a independência e a segurança dos testes.

## Non-Goals (Out of Scope)

- Testes unitários para os `use-cases` do módulo de treinamento.
- Testes de performance ou de carga.
- Testes para qualquer outro controller que não seja o `TrainingController`.

## Success Metrics

- **Cobertura de Código:** Atingir um alto nível de cobertura de código para o `TrainingController.ts`.
- **Execução bem-sucedida:** Todos os testes da suíte devem passar com sucesso no pipeline de CI/CD.
- **Detecção de Falhas:** A suíte deve ser capaz de falhar e identificar corretamente quando uma quebra de contrato (funcionalidade ou segurança) é introduzida no `TrainingController`.
