# PRD: Suíte de Testes E2E para o Enrollment Controller

## 1. Visão Geral

Este documento descreve os requisitos para a criação de uma suíte de testes End-to-End (E2E) abrangente para o `EnrollmentController`. O objetivo é garantir a confiabilidade, robustez e o correto funcionamento das funcionalidades de solicitação e listagem de matrículas, prevenindo regressões e validando as regras de negócio e segurança.

**Feature Slug:** `e2e-tests-for-enrollment-controller`

## 2. Problema e Justificativa

Atualmente, o `EnrollmentController` não possui cobertura de testes E2E, o que representa um risco para a estabilidade do sistema. Sem esses testes, alterações futuras no código ou em componentes relacionados (como serviços, banco de dados ou outros módulos) podem introduzir bugs não detectados que afetam diretamente a capacidade de um usuário de matricular seus dependentes em um clube.

A criação desta suíte de testes é fundamental para:
*   **Garantir a Qualidade:** Validar que as funcionalidades de matrícula funcionam conforme o esperado em um ambiente que simula a produção.
*   **Prevenir Regressões:** Criar uma rede de segurança que detecta falhas introduzidas por novas alterações.
*   **Documentar o Comportamento:** Os testes servirão como uma documentação viva do comportamento esperado da API.

## 3. Escopo e Requisitos Funcionais

O escopo desta tarefa é a criação de testes E2E para todas as rotas públicas do `EnrollmentController`.

### 3.1. Requisitos Técnicos e Estruturais

*   **R1.1:** Um novo diretório de testes deve ser criado em `test/enrollment/`.
*   **R1.2:** Um arquivo `test/enrollment/setup.ts` deve ser criado, seguindo o padrão de `test/club-management/setup.ts`. Ele deve exportar funções utilitárias para:
    *   `setupEnrollmentApp()`: Configura e retorna a instância da aplicação de teste e do `PrismaService`.
    *   `createRegularUser()`: Cria um usuário padrão com uma família e afiliação ativa.
    *   `createTestClub()`: Cria um clube para os testes.
    *   `createTestDependant()`: Cria um dependente para uma família.
    *   `enrollmentCleanup()`: Realiza a limpeza cirúrgica dos dados criados pelos testes (usuários, famílias, clubes, dependentes, solicitações de matrícula, etc.).
*   **R1.3:** Os testes devem utilizar a biblioteca `supertest` para realizar as requisições HTTP.
*   **R1.4:** Cada arquivo de teste deve ser independente e seguir o padrão `AAA (Arrange, Act, Assert)`.
*   **R1.5:** O cleanup dos dados deve ser executado no hook `afterAll` de cada suíte.

### 3.2. Casos de Teste para `POST /enrollments`

**Arquivo:** `request-enrollment.e2e-spec.ts`

*   **RF2.1 (Sucesso):** Deve criar uma solicitação de matrícula com sucesso (`201 Created`) quando o usuário logado fornece um `dependantId` e `clubId` válidos e pertencentes à sua família.
*   **RF2.2 (Erro):** Não deve permitir a criação de uma solicitação se o usuário não estiver autenticado (`401 Unauthorized`).
*   **RF2.3 (Erro):** Não deve permitir a criação de uma solicitação se o `clubId` não existir (`404 Not Found`).
*   **RF2.4 (Erro):** Não deve permitir a criação de uma solicitação se o `dependantId` não existir (`404 Not Found`).
*   **RF2.5 (Erro):** Não deve permitir a criação de uma solicitação se o dependente não pertencer à família do usuário logado (`403 Forbidden` ou `404 Not Found`, a ser definido pela regra de negócio).
*   **RF2.6 (Validação):** Não deve permitir a criação de uma solicitação se o `clubId` não for um UUID válido (`400 Bad Request`).
*   **RF2.7 (Validação):** Não deve permitir a criação de uma solicitação se o `dependantId` não for um UUID válido (`400 Bad Request`).
*   **RF2.8 (Regra de Negócio):** Não deve permitir a criação de uma solicitação duplicada (mesmo dependente, mesmo clube) se já existir uma pendente.

### 3.3. Casos de Teste para `GET /enrollments/my-requests`

**Arquivo:** `list-my-requests.e2e-spec.ts`

*   **RF3.1 (Sucesso):** Deve retornar uma lista (`200 OK`) com as solicitações de matrícula da família do usuário logado.
*   **RF3.2 (Sucesso):** Deve retornar uma lista vazia (`200 OK`) se a família do usuário logado não tiver nenhuma solicitação de matrícula.
*   **RF3.3 (Sucesso):** Deve retornar apenas as solicitações da família do usuário logado, ignorando as de outras famílias.
*   **RF3.4 (Erro):** Não deve retornar a lista de solicitações se o usuário não estiver autenticado (`401 Unauthorized`).

## 4. Fora do Escopo

*   Testes unitários ou de integração para os `use-cases`.
*   Testes para o fluxo de aprovação/rejeição de matrícula (que pertence ao `ClubManagementController`).
*   Testes para outros controllers.

## 5. Métricas de Sucesso

*   **100%** dos requisitos funcionais (casos de teste) implementados e passando.
*   A suíte de testes é executada com sucesso no pipeline de CI/CD.

## 6. Suposições e Dependências

*   **Suposição:** As regras de negócio implementadas nos `use-cases` (`RequestEnrollment` e `ListMyEnrollmentRequests`) estão corretas. Os testes E2E validarão a integração e o fluxo, não a lógica interna detalhada.
*   **Dependência:** A infraestrutura de testes E2E (Jest, Supertest, Prisma) já está configurada no projeto.
