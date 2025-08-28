# Technical Specification: DDD Fixes - Tournament Registration

## Executive Summary

Esta especificação detalha a correção da implementação DDD para o sistema de registro em torneios. A solução refatora o agregado Tournament para seguir corretamente os padrões Domain-Driven Design estabelecidos no projeto, mantendo Registration como entidade filha e RegistrationSync como entidade separada para implementar o padrão Transactional Outbox. A implementação utiliza Unit of Work para consistência transacional e centraliza toda comunicação assíncrona via RabbitMQ.

## System Architecture

### Domain Placement

- `src/domain/entities/tournament/` - Tournament aggregate root com Registration entities
- `src/domain/entities/registration/` - Registration entity (filha do Tournament)  
- `src/domain/entities/registration-sync/` - RegistrationSync entity para padrão outbox
- `src/domain/events/` - Domain events para comunicação assíncrona
- `src/application/use-cases/tournament/` - Use cases seguindo Unit of Work pattern
- `src/application/listeners/` - Domain event listeners locais
- `src/infraestructure/controllers/listeners/` - RabbitMQ message handlers
- `src/infraestructure/repositories/prisma/` - Repository implementations
- `src/shared/modules/` - Module configurations para RabbitMQ

### Component Overview

- **Tournament Aggregate Root**: Controla Registration e RegistrationSync, mantém invariantes de negócio
- **Registration Entity**: Entidade filha representando inscrição individual em torneio
- **RegistrationSync Entity**: Implementa padrão Transactional Outbox para sincronização externa
- **RequestIndividualRegistration Use Case**: Orquestra processo de registro com Unit of Work
- **RabbitMQ Event System**: Comunicação assíncrona para todos os domain events
- **Tournament Repository**: Persiste agregado completo incluindo entidades filhas

## Implementation Design

### Core Interfaces

```typescript
// Domain Repository Interface
interface TournamentRepository {
  find(id: string): Promise<Tournament | null>;
  save(tournament: Tournament): Promise<Tournament>;
}

// Use Case Interface
interface RequestIndividualRegistrationInput {
  tournamentId: string;
  competitorId: string;
  holderId: string;
}

// Domain Event Interface
interface RegistrationConfirmedEvent extends DomainEvent {
  registrationId: string;
  tournamentId: string;
  competitorId: string;
  isDuo: boolean;
}
```

### Data Models

```typescript
// Tournament Aggregate Root
export default class Tournament {
  private readonly _registrations: Registration[];
  private readonly _domainEvents: DomainEvent[];
  
  public requestIndividualRegistration(
    competitor: Dependant, 
    idGenerator: IdGenerator
  ): Registration {
    // Validações de negócio
    // Criação de Registration + RegistrationSync
    // Adicionar domain event
    // Manter invariantes do agregado
  }
  
  public cancelRegistration(registrationId: string): Registration
  public getDomainEvents(): DomainEvent[]
  public clearDomainEvents(): void
  
  // Factory method
  public static create(props: CreateTournamentProps, idGenerator: IdGenerator): Tournament
}

// Registration Entity (filha do Tournament)
export default class Registration {
  private readonly _sync: RegistrationSync;
  
  // Construtor privado - apenas Tournament pode criar
  private constructor(props: RegistrationConstructorProps) {}
  
  public cancel(): void
  public isConfirmed(): boolean
  
  // Factory method interno - usado apenas pelo Tournament
  public static createForTournament(
    tournamentId: string, 
    competitorId: string, 
    idGenerator: IdGenerator
  ): Registration
}

// RegistrationSync Entity 
export default class RegistrationSync {
  public updateSyncStatus(status: SyncStatus): void
  public incrementRetryAttempt(): void
  public isMaxRetriesReached(): boolean
  
  // Factory method
  public static create(registrationId: string, idGenerator: IdGenerator): RegistrationSync
}
```

### API Endpoints

- `POST /tournaments/registrations/request-individual` - Criar registro individual
- `POST /tournaments/registrations/cancel` - Cancelar registro

## Integration Points

### RabbitMQ Integration
- **Todos os domain events** são publicados via RabbitMQ usando padrões estabelecidos
- **Event Pattern**: `registration.confirmed` para criação de RegistrationSync
- **Message Pattern**: `Registration.Confirmed` para atualização de status

### External Systems
- **Prisma ORM**: Persistência via repository pattern com transações
- **External Tournament System**: Sincronização via RegistrationSync outbox pattern

## Impact Analysis

| Affected Component | Type of Impact | Description & Risk Level | Required Action |
|-------------------|----------------|-------------------------|-----------------|
| `Tournament Entity` | Structure Change | Refatoração para aggregate root completo. Medium risk. | Atualizar testes unitários |
| `Registration Entity` | Breaking Change | Remoção de factory method público. High risk. | Refatorar toda criação via Tournament |
| `RequestIndividualRegistration Use Case` | Pattern Change | Implementação Unit of Work. Medium risk. | Atualizar injeção de dependências |
| `Event System` | Architecture Change | Centralização via RabbitMQ. Low risk. | Remover EventEmitter2 usage |
| `Tournament Repository` | Enhancement | Persistência de agregado completo. Low risk. | Atualizar save operations |
| `Event Listeners` | Implementation Change | Usar repository ao invés de Prisma direto. Medium risk. | Refatorar listeners |

## Testing Approach

### Unit Tests

- **Tournament Aggregate**: 
  - `requestIndividualRegistration()` com validações de negócio
  - Domain events collection e clearing
  - Invariantes de agregado (período, tipo de torneio)
  - Factory method com validações

- **Registration Entity**: 
  - Operações específicas (cancel, status)
  - Construtor privado (não acessível externamente)
  - Relacionamento com RegistrationSync

- **RegistrationSync**: 
  - Retry logic e increment attempts
  - Status transitions (PENDING → SYNCED)
  - Max retries validation

- **Use Cases**: 
  - Unit of Work pattern implementation
  - Error handling scenarios
  - Domain event emission

### Integration Tests

- **E2E Registration Flow**: API → Use Case → Repository → Domain Events → RabbitMQ
- **Event Processing**: Domain events → RabbitMQ → Listeners → RegistrationSync update
- **Database Transactions**: Unit of Work rollback scenarios
- **Outbox Pattern**: RegistrationSync lifecycle complete testing
- **Repository Pattern**: Aggregate-aware persistence and loading

## Development Sequencing

### Build Order

1. **Domain Layer Refactoring** (Phase 1)
   - Atualizar Tournament aggregate root com domain events
   - Refatorar Registration entity (remover factory público)
   - Criar RegistrationSync entity correta
   - Implementar domain events collection/clearing

2. **Repository Pattern Update** (Phase 2)
   - Tournament repository persiste agregado completo
   - Implementar loading de aggregate com todas as entidades filhas
   - Unit tests para repository operations

3. **Use Case Implementation** (Phase 3)
   - Implementar Unit of Work pattern
   - Refatorar RequestIndividualRegistration use case
   - Remover dependency em EventEmitter2
   - Domain events apenas via aggregate lifecycle

4. **Event System Centralization** (Phase 4)
   - Refatorar event listeners para usar repository pattern
   - Configurar RabbitMQ conforme padrões estabelecidos
   - Implementar proper error handling em listeners

5. **Integration Testing** (Phase 5)
   - Testes E2E completos
   - Validação de domain events flow
   - Performance testing de agregado

### Technical Dependencies

- **Unit of Work** implementation deve estar disponível no projeto
- **RabbitMQ infrastructure** configurada conforme `rabbitmq-nestjs-standardization.md`
- **Domain event base classes** implementadas
- **Prisma schema** compatível com aggregate boundaries
- **ID Generator** service disponível

## Monitoring & Observability

### Metrics to Expose (Prometheus format)

```typescript
// Registration success/failure rates
tournament_registrations_total{status="success|failure", type="individual"}

// Processing time for registrations
tournament_registration_duration_seconds{operation="request|cancel"}

// RegistrationSync status distribution
tournament_sync_status_total{status="pending|synced|failed"}

// Retry attempts distribution
tournament_sync_retry_attempts_total{attempt_count="1|2|3|max"}
```

### Key Logs and Log Levels

- **INFO**: Registration created, cancelled, synced
- **DEBUG**: Domain events emitted, aggregate state changes
- **ERROR**: Business rule violations, sync failures
- **WARN**: Retry attempts, max retries reached

## Technical Considerations

### Key Decisions

1. **RegistrationSync como Entidade Separada**: 
   - **Rationale**: Implementa padrão Transactional Outbox essencial para integrações
   - **Trade-offs**: Maior complexidade vs. robustez e observability
   - **Validation**: Confirmado por análise profunda com expert validation

2. **Unit of Work Pattern**: 
   - **Rationale**: Garante consistência transacional do agregado completo
   - **Trade-offs**: Complexidade adicional vs. consistência garantida
   - **Alternative Rejected**: Repository direto (perderia consistência multi-entity)

3. **RabbitMQ Centralizado**: 
   - **Rationale**: Seguir padrões estabelecidos no projeto
   - **Trade-offs**: Dependency em messaging vs. desacoplamento e reliability
   - **Alternative Rejected**: EventEmitter2 (local apenas, sem durability)

4. **Registration como Entidade Filha**: 
   - **Rationale**: Seguindo padrão estabelecido (Club/ClubMembership)
   - **Trade-offs**: Aggregate boundary clara vs. flexibilidade individual
   - **Alternative Rejected**: Registration como aggregate separado (perderia consistência)

### Known Risks

1. **Breaking Changes**: 
   - **Risk**: Refatoração extensiva pode quebrar código existente
   - **Mitigation**: TDD approach, comprehensive test coverage
   - **Impact**: High - requer coordenação com other features

2. **Event Ordering**: 
   - **Risk**: Domain events podem ser processados fora de ordem
   - **Mitigation**: Usar message ordering em RabbitMQ, idempotent handlers
   - **Impact**: Medium - pode causar inconsistências temporárias

3. **Transaction Complexity**: 
   - **Risk**: Unit of Work adiciona complexidade transacional
   - **Mitigation**: Comprehensive unit tests, clear error handling
   - **Impact**: Medium - debugging mais complexo

4. **Performance Impact**: 
   - **Risk**: Aggregate loading pode ser mais lento
   - **Mitigation**: Lazy loading, query optimization
   - **Impact**: Low - expected nos padrões DDD

### Special Requirements

#### Performance Requirements
- Registration creation: < 500ms (P95)
- Aggregate loading: < 200ms (P95) 
- Event processing: < 1s (P95)

#### Security Considerations
- Validate tournament access permissions antes de registration
- Audit trail via domain events
- Rate limiting para registration attempts

### Standards Compliance

#### Architecture Standards
- ✅ Follows `docs/ddd-aggregate-root-standardization.md` principles
- ✅ Implements aggregate root as single point of entry
- ✅ Maintains transaction boundaries correctly
- ✅ Uses factory methods for entity creation

#### Communication Standards  
- ✅ Applies `docs/rabbitmq-nestjs-standardization.md` patterns
- ✅ Uses ClientProxy for event emission
- ✅ Implements proper error handling and acknowledgment
- ✅ Follows message pattern conventions

#### Code Standards
- ✅ Uses `.cursor/rules/code-standards.mdc` conventions
- ✅ No UseCase suffix in class names
- ✅ Meaningful method names starting with verbs
- ✅ Proper dependency injection patterns

#### Testing Standards
- ✅ Follows `.cursor/rules/tests-standards.mdc` requirements
- ✅ TDD approach com comprehensive coverage
- ✅ Unit tests for all aggregate behavior
- ✅ Integration tests for complete workflows

## Implementation Checklist

### Domain Layer
- [ ] Tournament aggregate root com domain events collection
- [ ] Registration entity com construtor privado
- [ ] RegistrationSync entity com retry logic
- [ ] Domain events properly defined
- [ ] Factory methods com validações completas

### Application Layer
- [ ] RequestIndividualRegistration use case com Unit of Work
- [ ] Event listeners using repository pattern
- [ ] Proper error handling and exceptions
- [ ] Remove EventEmitter2 dependencies

### Infrastructure Layer
- [ ] Tournament repository persiste agregado completo
- [ ] RabbitMQ listeners seguem padrões estabelecidos
- [ ] Prisma transactions via Unit of Work
- [ ] Proper module configuration

### Testing
- [ ] Unit tests para todos os aggregates
- [ ] Integration tests E2E completos
- [ ] Event processing tests
- [ ] Performance tests para aggregate loading
- [ ] Error scenario coverage

Esta especificação técnica garante que a implementação siga rigorosamente os padrões DDD estabelecidos no projeto, mantendo a robustez necessária para o padrão Transactional Outbox enquanto corrige as violações arquiteturais identificadas.