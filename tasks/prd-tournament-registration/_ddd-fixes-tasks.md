# [Tournament Registration] DDD Fixes Implementation Task Summary

## Overview

This task list addresses critical DDD architectural violations in the tournament registration system, implementing proper aggregate boundaries, Unit of Work pattern, Transactional Outbox, and centralized event handling via RabbitMQ.

## Architecture Violations Addressed

1. **Registration entity violates aggregate boundary rules** (has public factory method)
2. **Tournament aggregate root doesn't properly handle domain events**
3. **Use case doesn't follow Unit of Work pattern**
4. **Event handling is scattered instead of centralized via RabbitMQ**
5. **Repository pattern is inconsistent with aggregate boundaries**

## Relevant Files

### Core Implementation Files

- `src/domain/entities/tournament/tournament.entity.ts` - Tournament aggregate root with proper domain events
- `src/domain/entities/registration/registration.entity.ts` - Registration entity with private constructor
- `src/domain/entities/registration-sync/registration-sync.entity.ts` - RegistrationSync for Transactional Outbox
- `src/domain/events/registration-confirmed.event.ts` - Domain event definitions
- `src/application/use-cases/tournament/request-individual-registration.use-case.ts` - Use case with Unit of Work

### Infrastructure Files

- `src/infraestructure/repositories/prisma/tournament.repository.prisma.ts` - Aggregate-aware repository
- `src/infraestructure/controllers/listeners/tournament.listener.ts` - RabbitMQ message handlers
- `src/application/listeners/create-registration-sync-on-registration-confirmed.listener.ts` - Domain event listeners
- `src/application/listeners/publish-integration-event-on-registration-confirmed.listener.ts` - RabbitMQ publishers

### Configuration Files

- `src/shared/modules/tournament.module.ts` - Module configuration for RabbitMQ
- `prisma/schema.prisma` - Database schema updates for outbox pattern

### Testing Files

- `test/tournament/individual-registration.e2e-spec.ts` - End-to-end validation tests
- `src/domain/entities/tournament/tournament.spec.ts` - Unit tests for aggregate behavior
- `src/domain/entities/registration/registration.spec.ts` - Unit tests for entity behavior
- `src/domain/entities/registration-sync/registration-sync.spec.ts` - Unit tests for outbox entity

## Implementation Phases

### Phase 1: Domain Layer Refactoring
- [ ] 14.0 Refactor Tournament as Proper Aggregate Root
- [ ] 15.0 Fix Registration Entity with Private Constructor
- [ ] 16.0 Implement RegistrationSync Entity for Outbox Pattern
- [ ] 17.0 Implement Domain Events Collection and Clearing

### Phase 2: Repository Pattern Update  
- [ ] 18.0 Update Tournament Repository for Aggregate Persistence
- [ ] 19.0 Remove Registration Repository (Aggregate Boundary Violation)
- [ ] 20.0 Implement Aggregate Loading with Child Entities

### Phase 3: Use Case Implementation
- [ ] 21.0 Implement Unit of Work Pattern in Use Cases
- [ ] 22.0 Refactor RequestIndividualRegistration Use Case
- [ ] 23.0 Remove EventEmitter2 Dependencies

### Phase 4: Event System Centralization
- [ ] 24.0 Refactor Event Listeners to Use Repository Pattern
- [ ] 25.0 Configure RabbitMQ Following Project Standards
- [ ] 26.0 Implement Transactional Outbox Event Publisher

### Phase 5: Integration Testing
- [ ] 27.0 Implement Comprehensive E2E Tests
- [ ] 28.0 Validate Domain Events Flow End-to-End
- [ ] 29.0 Performance Testing for Aggregate Operations
- [ ] 30.0 Implement Monitoring and Observability

## Success Metrics

- **Domain Integrity**: All aggregate boundaries properly enforced
- **Event Consistency**: 100% of events flow through RabbitMQ with exactly-once semantics
- **Transactional Consistency**: Unit of Work ensures ACID properties across aggregate operations
- **Performance**: Registration operations < 500ms (P95), Aggregate loading < 200ms (P95)
- **Reliability**: Event processing < 1s (P95), Zero event loss during outbox processing

## Technical Dependencies

- Unit of Work implementation available in project
- RabbitMQ infrastructure configured per project standards
- Domain event base classes implemented
- Prisma schema compatible with aggregate boundaries
- ID Generator service available

## Risk Mitigation

- **Backward Compatibility**: Maintain existing APIs with adapter facades during migration
- **Feature Flags**: Control rollout with progressive enablement
- **Dual Publishing**: Run legacy and RabbitMQ systems in parallel during transition
- **Monitoring**: Comprehensive observability for outbox lag, consumer errors, queue depth
- **Testing Strategy**: TDD approach with comprehensive unit and integration test coverage

---

*Esta especificação garante que a implementação siga rigorosamente os padrões DDD estabelecidos no projeto, corrigindo as violações arquiteturais críticas identificadas.*