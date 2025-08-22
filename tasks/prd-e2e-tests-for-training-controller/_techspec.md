# Technical Specification: E2E Tests para TrainingController

## Executive Summary

Esta especificação documenta a arquitetura e implementação da suíte de testes End-to-End (E2E) para o TrainingController, seguindo os padrões estabelecidos no projeto NCFCA API. A solução utiliza NestJS TestingModule, Jest, Supertest e Prisma para garantir testes robustos com cleanup cirúrgico e isolamento completo. A implementação atual já atende todos os requisitos do PRD, fornecendo cobertura abrangente para operações CRUD com controle de acesso baseado em roles. Esta suíte de testes serve como uma rede de segurança crítica contra regressões futuras.

## System Architecture

### Domain Placement

A suíte de testes E2E está localizada na seguinte estrutura:

- `test/training/` - Módulo de testes E2E específico para TrainingController
  - `setup.ts` - Funções de configuração e utilitários compartilhados
  - `list-trainings.e2e-spec.ts` - Testes para GET /trainings
  - `create-training.e2e-spec.ts` - Testes para POST /trainings
  - `update-training.e2e-spec.ts` - Testes para PUT /trainings/:id
  - `delete-training.e2e-spec.ts` - Testes para DELETE /trainings/:id
- `test/utils/` - Utilitários compartilhados entre módulos de teste
  - `prisma/cleanup.ts` - Funções de cleanup cirúrgico
  - `prisma/create-test-user.ts` - Criação de usuários para teste

### Component Overview

**Setup Component**: Gerencia inicialização da aplicação, criação de usuários com diferentes roles e cleanup cirúrgico dos dados de teste.

**Test Suite Components**: Cada endpoint possui seu próprio arquivo de teste com cenários de sucesso e falha, validação de autorização e autenticação.

**Data Flow**: Testes → Setup → NestJS TestingModule → TrainingController → Use Cases → Prisma → PostgreSQL Test Database

## Implementation Design

### Core Interfaces

```typescript
// Interface para usuários de teste com tokens de acesso
interface TrainingTestUser {
  userId: string;
  familyId: string;
  accessToken: string;
}

// Função de setup principal da aplicação
async function setupTrainingApp(): Promise<{ 
  app: INestApplication; 
  prisma: PrismaService 
}>;

// Funções de criação de usuários por role
async function createAdminUser(
  app: INestApplication, 
  prisma: PrismaService, 
  familyStatus?: FamilyStatus
): Promise<TrainingTestUser>;

async function createClubOwnerUser(
  app: INestApplication, 
  prisma: PrismaService
): Promise<TrainingTestUser>;

async function createRegularUser(
  app: INestApplication, 
  prisma: PrismaService
): Promise<TrainingTestUser>;

// Função para criar dados de treinamento para teste
async function createTestTraining(
  prisma: PrismaService,
  overrides?: Partial<{ title: string; description: string; youtubeUrl: string }>
): Promise<Training>;

// Função de cleanup cirúrgico específico para Training
async function trainingCleanup(prisma: PrismaService, userIds: string[]): Promise<void>;
```

### Data Models

**Training Entity**:
- id (UUID)
- title (string)
- description (string) 
- youtube_url (string com validação)
- created_at (timestamp)
- updated_at (timestamp)

**Request/Response Types**:
- `CreateTrainingDto`: { title, description, youtubeUrl }
- `UpdateTrainingDto`: Partial<CreateTrainingDto>
- `TrainingResponseDto`: Training com campos formatados
- `TrainingListItemView`: Visualização otimizada para listagem

### API Endpoints

**GET /trainings**:
- Roles: ADMIN, DONO_DE_CLUBE
- Response: TrainingListItemView[]
- Status: 200 OK, 401 Unauthorized, 403 Forbidden

**POST /trainings**:
- Roles: ADMIN
- Request: CreateTrainingDto
- Response: TrainingResponseDto
- Status: 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden

**PUT /trainings/:id**:
- Roles: ADMIN
- Request: UpdateTrainingDto
- Response: TrainingResponseDto
- Status: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

**DELETE /trainings/:id**:
- Roles: ADMIN
- Response: void
- Status: 204 No Content, 401 Unauthorized, 403 Forbidden, 404 Not Found

## Integration Points

- **HTTP Server (`supertest`)**: All tests will interact with the application via HTTP requests to the running NestJS instance.
- **Database (`PrismaClient`)**: The test setup and cleanup phases will interact directly with the PostgreSQL database via the Prisma client to arrange test data and ensure a clean state between runs.

## Impact Analysis

This feature is purely additive and isolated to the `test/` directory.

| Affected Component | Type of Impact | Description & Risk Level | Required Action |
| ------------------ | -------------- | ------------------------ | --------------- |
| `test/` directory  | Additive       | New files for E2E tests. Zero risk. | None.           |
| Production Code    | None           | No impact on `src/`. Zero risk.     | None.           |

## Testing Approach

This document describes the implementation of an E2E test suite. The strategy is to cover every requirement outlined in the PRD in its own dedicated test file.

### Scenarios to be Tested

- **`list-trainings.e2e-spec.ts` (`GET /trainings`)**:
  - `ADMIN` can list trainings (200 OK).
  - `DONO_DE_CLUBE` can list trainings (200 OK).
  - User `SEM_FUNCAO` is denied access (403 Forbidden).
  - Unauthenticated request is denied (401 Unauthorized).

- **`create-training.e2e-spec.ts` (`POST /trainings`)**:
  - `ADMIN` can create a training (201 Created).
  - `DONO_DE_CLUBE` is denied access (403 Forbidden).
  - `ADMIN` request with invalid data is rejected (400 Bad Request).
  - Unauthenticated request is denied (401 Unauthorized).

- **`update-training.e2e-spec.ts` (`PUT /trainings/:id`)**:
  - `ADMIN` can update a training (200 OK).
  - `DONO_DE_CLUBE` is denied access (403 Forbidden).
  - `ADMIN` request to update a non-existent training fails (404 Not Found).
  - `ADMIN` request with invalid data is rejected (400 Bad Request).
  - Unauthenticated request is denied (401 Unauthorized).

- **`delete-training.e2e-spec.ts` (`DELETE /trainings/:id`)**:
  - `ADMIN` can delete a training (204 No Content).
  - `DONO_DE_CLUBE` is denied access (403 Forbidden).
  - `ADMIN` request to delete a non-existent training fails (404 Not Found).
  - Unauthenticated request is denied (401 Unauthorized).

## Development Sequencing

### Build Order

1.  **`test/training/setup.ts`**: Implement the setup module first, as all spec files will depend on it.
2.  **`test/training/list-trainings.e2e-spec.ts`**: Implement the first test suite.
3.  **`test/training/create-training.e2e-spec.ts`**: Implement the second test suite.
4.  **`test/training/update-training.e2e-spec.ts`**: Implement the third test suite.
5.  **`test/training/delete-training.e2e-spec.ts`**: Implement the final test suite.
6.  **Execution**: Run the full test suite using `pnpm run test:e2e` and ensure all pass.

### Technical Dependencies

- None. All required tools (`Jest`, `supertest`, `Prisma`) are already part of the project.

## Monitoring & Observability

Not applicable for this E2E test suite.

## Technical Considerations

### Key Decisions

- **Granular Test Files**: The decision to create one spec file per use case (`list`, `create`, `update`, `delete`) directly follows the established project pattern, enhancing clarity and maintainability.
- **Surgical Cleanup**: Using a shared cleanup function (`trainingCleanup`) that deletes specific, tracked entities is a deliberate choice to prevent test interference and support parallel execution in the future.

### Known Risks

- There are no technical risks associated with this implementation, as it is confined to the test environment and does not alter production logic.

### Standards Compliance

- The implementation will adhere to all project standards defined in `.cursor/rules/`.
- **`tests-standards.mdc`**: Naming conventions (`describe('(E2E) CreateTraining'`, `it('Deve ...')`), the Arrange-Act-Assert pattern, and surgical cleanup will be strictly followed.
- **`code-standards.mdc`**: Code within test files will follow project-wide conventions for clarity and consistency.