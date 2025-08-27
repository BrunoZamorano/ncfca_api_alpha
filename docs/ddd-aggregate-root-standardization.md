# Padronização de Domain-Driven Design: Aggregate Root como Fronteira de Consistência Transacional

**Versão:** 2.0  
**Data:** 2025-01-27  
**Status:** Atualizado com feedback do consenso multi-model

## Visão Geral

Este documento descreve o padrão arquitetural de **Aggregate Root** aplicado no projeto NCFCA API, seguindo os princípios de Domain-Driven Design (DDD). O padrão estabelece **fronteiras de consistência transacional** claras, garantindo integridade de dados e simplicidade operacional através da máxima: **"A simplicidade é o ápice da sofisticação"** - *Leonardo da Vinci*.

## Arquitetura

### Fluxo de Consistência Transacional

```
Use Case → Repository → Aggregate Root → Entities → Value Objects
          ↓ (opcional para múltiplos agregados)
       UnitOfWork
```

1. **Use Case**: Orquestra a operação de negócio
2. **Repository**: Carrega e persiste agregados (relação fundamental)
3. **UnitOfWork**: Recurso opcional para coordenar múltiplos agregados em uma transação
4. **Aggregate Root**: Garantia de consistência e integridade
5. **Entities**: Objetos de domínio com identidade
6. **Value Objects**: Objetos imutáveis sem identidade

> **Nota Importante**: A relação fundamental é Use Case → Repository. O UnitOfWork é acionado apenas quando o Use Case precisa persistir múltiplos agregados, o que frequentemente indica que o Use Case pode ter múltiplas responsabilidades.

### Responsabilidades

- **Aggregate Root**: Ponto único de entrada, consistência de dados, regras de negócio
- **Repository**: Carregamento e persistência do agregado completo (relação obrigatória)
- **UnitOfWork**: Gerenciamento transacional opcional para múltiplos agregados
- **Use Cases**: Coordenação de operações, idealmente com responsabilidade única

## O Club como Aggregate Root

### Estrutura do Agregado

```typescript
// Aggregate Root
export default class Club {
  private readonly _members: ClubMembership[]; // Entidades filhas
  private readonly _address: Address;          // Value Object
  
  // Club é o ÚNICO ponto de entrada para modificações
  public addMember(memberId: string, familyId: string, idGenerator: IdGenerator): void
  public removeMember(memberId: string): void
  public changeOwner(newOwnerId: string): void
}
```

### Fronteira de Consistência

O **Club** define uma fronteira clara onde:
- ✅ **Tudo dentro** é consistente em uma transação
- ✅ **Uma única instância** controla todas as modificações
- ✅ **Regras de negócio** são centralizadas
- ✅ **Estados inválidos** são impossíveis

```typescript
// ✅ CORRETO: Modificação através do Aggregate Root
club.addMember(memberId, familyId, idGenerator);

// ❌ INCORRETO: Modificação direta da entidade filha
membership.setStatus(MembershipStatus.ACTIVE); // Quebra consistência
```

## Implementação no Projeto

### 1. Aggregate Root: Club

```typescript
export default class Club {
  private readonly _members: ClubMembership[]; // Aggregate boundary
  
  // Factory method - criação controlada
  public static create(props: CreateClubProps, idGenerator: IdGenerator): Club {
    // Validações de negócio
    if (!props.name || props.name.trim().length < 3) {
      throw new InvalidOperationException('Club name is required and must have at least 3 characters.');
    }
    
    return new Club({
      id: idGenerator.generate(),
      name: props.name,
      address: props.address,
      members: [], // Estado inicial consistente
      createdAt: new Date(),
      maxMembers: props.maxMembers,
      principalId: props.principalId,
    });
  }

  // Operação de negócio - mantém invariantes
  public addMember(memberId: string, familyId: string, idGenerator: IdGenerator): void {
    // 1. Verificar estado atual
    const membership = this.findMembershipByDependantId(memberId);
    if (membership?.isActive()) {
      throw new InvalidOperationException(`Dependant ${memberId} is already an active member`);
    }
    
    // 2. Aplicar regra de negócio
    if (this.isAtMaxCapacity()) {
      throw new InvalidOperationException('O clube já atingiu o número máximo de membros.');
    }
    
    // 3. Modificar estado de forma consistente
    if (membership) {
      membership.reinstate(); // Reativar membership existente
    } else {
      const newMembership = ClubMembership.create({
        clubId: this._id,
        memberId: memberId,
        familyId,
      }, idGenerator);
      this._members.push(newMembership); // Adicionar nova membership
    }
  }

  // Invariante - máximo de membros
  public isAtMaxCapacity(): boolean {
    if (!this._maxMembers) return false;
    return this.getActiveMembersCount() >= this._maxMembers;
  }
  
  // Estado derivado - sempre consistente
  public getActiveMembersCount(): number {
    return this._members.filter((m) => m.isActive()).length;
  }
}
```

### 2. Entidade Filha: ClubMembership

```typescript
export default class ClubMembership {
  // Entidade dentro do agregado - modificações controladas
  public readonly memberId: string;
  public status: MembershipStatus;
  
  // Operações específicas da entidade
  public revoke(): void {
    if (this.status !== MembershipStatus.ACTIVE) {
      throw new InvalidOperationException('Cannot revoke a membership that is not active.');
    }
    this.status = MembershipStatus.REVOKED;
  }

  public reinstate(): void {
    if (this.status !== MembershipStatus.REVOKED) {
      throw new InvalidOperationException('Cannot reinstate a membership that is not revoked.');
    }
    this.status = MembershipStatus.ACTIVE;
  }

  public isActive(): boolean {
    return this.status === MembershipStatus.ACTIVE;
  }
}
```

## Padrão Transacional

### Use Case com UnitOfWork

```typescript
@Injectable()
export default class ApproveEnrollment {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly _uow: UnitOfWork,
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
  ) {}

  async execute(input: ApproveEnrollmentInput): Promise<void> {
    // UnitOfWork garante atomicidade
    return await this._uow.executeInTransaction(async () => {
      // 1. Carregar agregado
      const club = await this._uow.clubRepository.find(request.clubId);
      if (!club) {
        throw new EntityNotFoundException('Club', request.clubId);
      }

      // 2. Verificar pré-condições
      if (club.principalId !== input.loggedInUserId) {
        throw new ForbiddenException('User is not authorized');
      }

      // 3. Operação de negócio através do Aggregate Root
      club.addMember(request.dependantId, request.familyId, this._idGenerator);
      request.approve();

      // 4. Persistir o agregado completo
      await this._uow.clubRepository.save(club);
      await this._uow.enrollmentRequestRepository.save(request);
      
      // Transação commitada automaticamente se nenhuma exceção
    });
  }
}
```

### Repository Pattern

```typescript
// Repository trabalha com agregado completo
export interface ClubRepository {
  // Sempre carrega o agregado inteiro
  find(id: string): Promise<Club | null>;
  findByPrincipalId(principalId: string): Promise<Club | null>;
  
  // Sempre persiste o agregado inteiro
  save(club: Club): Promise<Club>;
}
```

## Fronteiras de Consistência

### ✅ Dentro do Agregado (Forte Consistência)

```typescript
// Operação atômica - tudo ou nada
club.addMember(memberId, familyId, idGenerator);
// - Verifica capacidade máxima
// - Cria ou reativa membership
// - Mantém invariantes
// - Estado sempre consistente
```

### ⚠️ Entre Agregados (Eventual Consistência)

```typescript
// Use Cases coordenam operações entre agregados
async execute(input: CreateClub): Promise<ClubCreationResult> {
  return this._uow.executeInTransaction(async () => {
    // Agregado User - consistência forte interna
    user.assignRoles([UserRoles.DONO_DE_CLUBE]);
    await this._uow.userRepository.save(user);
    
    // Agregado Club - consistência forte interna
    const club = Club.create(clubProps, this._idGenerator);
    await this._uow.clubRepository.save(club);
    
    // Entre User e Club - consistência eventual via UnitOfWork
  });
}
```

## Regras de Implementação

### Factory Methods

```typescript
// ✅ CORRETO: Factory method com validações
public static create(props: CreateClubProps, idGenerator: IdGenerator): Club {
  // Todas as validações de negócio
  if (!props.name || props.name.trim().length < 3) {
    throw new InvalidOperationException('Invalid club name');
  }
  
  return new Club({
    id: idGenerator.generate(),
    name: props.name,
    members: [], // Estado inicial válido
    // ...
  });
}

// ❌ INCORRETO: Constructor público sem validações
constructor(props: ClubProps) {
  this._name = props.name; // Pode ser inválido
}
```

### Encapsulamento

```typescript
export default class Club {
  // ✅ CORRETO: Propriedades privadas
  private readonly _members: ClubMembership[];
  private _name: string;
  
  // ✅ CORRETO: Getters readonly
  get members(): Readonly<ClubMembership[]> {
    return this._members;
  }
  
  // ✅ CORRETO: Modificação controlada
  public updateInfo(props: UpdateClubInfoProps): void {
    if (props.name && props.name.trim().length >= 3) {
      this._name = props.name;
    }
  }
}

// ❌ INCORRETO: Propriedades públicas
export class Club {
  public members: ClubMembership[]; // Quebra encapsulamento
}
```

## Testing

### Teste de Aggregate Root

```typescript
describe('Club Aggregate Root', () => {
  it('should maintain capacity invariant when adding member', () => {
    // Arrange
    const club = Club.create({
      name: 'Test Club',
      maxMembers: 1,
      address: mockAddress,
      principalId: 'principal-1'
    }, mockIdGenerator);
    
    // Act & Assert - primeira adição
    expect(() => {
      club.addMember('member-1', 'family-1', mockIdGenerator);
    }).not.toThrow();
    
    // Act & Assert - violação de capacidade
    expect(() => {
      club.addMember('member-2', 'family-2', mockIdGenerator);
    }).toThrow(InvalidOperationException);
  });

  it('should prevent direct state manipulation', () => {
    const club = Club.create(validProps, mockIdGenerator);
    
    // Estado deve ser imutável externamente
    const members = club.members;
    expect(() => {
      (members as any).push(new ClubMembership());
    }).toThrow();
  });
});
```

## Estrutura de Arquivos

```
src/
├── domain/
│   ├── entities/                    # Aggregate Roots e Entities
│   │   ├── club/
│   │   │   ├── club.ts             # Aggregate Root
│   │   │   └── club.spec.ts        # Testes de domínio
│   │   └── club-membership/
│   │       └── club-membership.entity.ts # Entity filha
│   ├── value-objects/              # Value Objects
│   │   └── address/
│   │       └── address.ts
│   ├── services/                   # Domain Services
│   │   └── unit-of-work.ts        # Interface transacional
│   └── exceptions/                 # Domain Exceptions
├── application/
│   └── use-cases/                  # Application Services
│       └── club/
│           ├── create-club/
│           └── approve-enrollment/
└── infraestructure/
    ├── repositories/               # Implementação de repositórios
    └── services/
        ├── unit-of-work.prisma.ts # Implementação transacional
        └── unit-of-work.memory.ts # Para testes
```

## Regras de Desenvolvimento

### ✅ Práticas Obrigatórias

- **Aggregate Root** é o único ponto de modificação
- **Factory methods** para criação com validações
- **Encapsulamento** com propriedades privadas
- **Invariantes** verificadas em todas as operações
- **UnitOfWork** para controle transacional
- **Repository** persiste agregado completo
- **Operações semânticas** ao invés de setters genéricos

### ❌ Práticas Proibidas

- Modificação direta de entidades filhas
- Propriedades públicas mutatáveis
- Construtores públicos sem validações
- Persistência parcial do agregado
- Transações fora do UnitOfWork
- Setters genéricos que quebram invariantes
- Referencias entre agregados (usar IDs)

## Anti-Padrões Detalhados

### 1. Anemic Domain Model

```typescript
// ❌ INCORRETO: Modelo anêmico - apenas dados
export class Club {
  public id: string;
  public name: string;
  public members: ClubMembership[];
  public maxMembers?: number;
}

// Service faz toda a lógica
export class ClubService {
  addMember(club: Club, memberId: string) {
    if (club.members.length >= club.maxMembers) {
      throw new Error('Capacity exceeded');
    }
    club.members.push(new ClubMembership({ memberId }));
  }
}
```

```typescript
// ✅ CORRETO: Rich Domain Model
export default class Club {
  private readonly _members: ClubMembership[];
  private _maxMembers?: number;
  
  public addMember(memberId: string, familyId: string, idGenerator: IdGenerator): void {
    if (this.isAtMaxCapacity()) {
      throw new InvalidOperationException('O clube já atingiu o número máximo de membros.');
    }
    // Lógica de negócio encapsulada no agregado
  }
}
```

### 2. Transaction Script

```typescript
// ❌ INCORRETO: Lógica procedural no Use Case
export class ApproveEnrollmentUseCase {
  async execute(input: ApproveEnrollmentInput): Promise<void> {
    const club = await this.clubRepository.find(input.clubId);
    const request = await this.enrollmentRepository.find(input.requestId);
    
    // Lógica de negócio espalhada
    if (club.members.filter(m => m.status === 'ACTIVE').length >= club.maxMembers) {
      throw new Error('Club at capacity');
    }
    
    request.status = 'APPROVED';
    club.members.push({ memberId: request.memberId, status: 'ACTIVE' });
    
    await this.clubRepository.save(club);
    await this.enrollmentRepository.save(request);
  }
}
```

```typescript
// ✅ CORRETO: Lógica no Aggregate Root
export class ApproveEnrollmentUseCase {
  async execute(input: ApproveEnrollmentInput): Promise<void> {
    return await this._uow.executeInTransaction(async () => {
      const club = await this._uow.clubRepository.find(input.clubId);
      const request = await this._uow.enrollmentRequestRepository.find(input.requestId);
      
      // Delegate para o agregado
      club.addMember(request.dependantId, request.familyId, this._idGenerator);
      request.approve();
      
      await this._uow.clubRepository.save(club);
      await this._uow.enrollmentRequestRepository.save(request);
    });
  }
}
```

### 3. Aggregate Boundary Violations

```typescript
// ❌ INCORRETO: Modificação através de múltiplos agregados
export class TransferMemberUseCase {
  async execute(memberId: string, fromClubId: string, toClubId: string): Promise<void> {
    const fromClub = await this.clubRepository.find(fromClubId);
    const toClub = await this.clubRepository.find(toClubId);
    const membership = fromClub.members.find(m => m.memberId === memberId);
    
    // Quebra de fronteira - manipulação direta
    membership.status = 'INACTIVE';
    toClub.members.push(new ClubMembership({ memberId, status: 'ACTIVE' }));
  }
}
```

```typescript
// ✅ CORRETO: Operações através dos Aggregate Roots
export class TransferMemberUseCase {
  async execute(memberId: string, fromClubId: string, toClubId: string): Promise<void> {
    return await this._uow.executeInTransaction(async () => {
      const fromClub = await this._uow.clubRepository.find(fromClubId);
      const toClub = await this._uow.clubRepository.find(toClubId);
      
      // Cada agregado controla suas próprias modificações
      fromClub.removeMember(memberId);
      toClub.addMember(memberId, familyId, this._idGenerator);
      
      await this._uow.clubRepository.save(fromClub);
      await this._uow.clubRepository.save(toClub);
    });
  }
}
```

### 🔧 Configurações Transacionais

```typescript
// ✅ CORRETO: Transação por Use Case
@Injectable()
export class CreateClubUseCase {
  async execute(input: CreateClubInput): Promise<ClubResult> {
    return await this._uow.executeInTransaction(async () => {
      // Toda lógica dentro da transação
      const club = Club.create(props, this._idGenerator);
      return await this._uow.clubRepository.save(club);
    });
  }
}
```

## Checklist de Desenvolvimento

### Novo Aggregate Root
- [ ] Factory method com validações completas
- [ ] Propriedades privadas com getters readonly
- [ ] Operações semânticas de negócio
- [ ] Invariantes verificadas em todas as modificações
- [ ] Testes de domínio cobrindo regras de negócio
- [ ] Exceptions específicas para violações

### Nova Entity Filha
- [ ] Modificações controladas pelo Aggregate Root
- [ ] Estado sempre consistente
- [ ] Operações específicas da entidade
- [ ] Não referencia outros agregados diretamente

### Novo Use Case
- [ ] Usa UnitOfWork para transações
- [ ] Opera através do Aggregate Root
- [ ] Trata exceções de domínio adequadamente
- [ ] Logs estruturados de operações

### Novo Repository
- [ ] Interface no domínio
- [ ] Implementação na infraestrutura
- [ ] Carrega agregado completo
- [ ] Persiste agregado completo

## FAQ - Perguntas Frequentes

### Q: Quando devo usar UnitOfWork vs Repository direto?
**A:** Use Repository diretamente para operações em um único agregado. Use UnitOfWork quando precisar coordenar múltiplos agregados em uma transação.

```typescript
// Operação simples - Repository direto
export class UpdateClubInfoUseCase {
  async execute(input: UpdateClubInfoInput): Promise<void> {
    const club = await this.clubRepository.find(input.clubId);
    club.updateInfo(input);
    await this.clubRepository.save(club);
  }
}

// Múltiplos agregados - UnitOfWork
export class CreateClubUseCase {
  async execute(input: CreateClubInput): Promise<void> {
    return await this._uow.executeInTransaction(async () => {
      user.assignRoles([UserRoles.DONO_DE_CLUBE]);  // Agregado User
      const club = Club.create(props, idGenerator);  // Agregado Club
      
      await this._uow.userRepository.save(user);
      await this._uow.clubRepository.save(club);
    });
  }
}
```

### Q: Como lidar com validações que dependem de dados externos?
**A:** Use Domain Services para validações complexas que precisam acessar múltiplos agregados.

```typescript
// Domain Service para validações complexas
export interface ClubValidationService {
  validateUniqueName(name: string, excludeId?: string): Promise<boolean>;
  validatePrincipalEligibility(principalId: string): Promise<boolean>;
}

// Uso no Aggregate Root
export default class Club {
  public static async create(
    props: CreateClubProps, 
    idGenerator: IdGenerator,
    validationService: ClubValidationService
  ): Promise<Club> {
    if (!await validationService.validateUniqueName(props.name)) {
      throw new InvalidOperationException('Club name already exists');
    }
    
    return new Club({ /* ... */ });
  }
}
```

### Q: Como implementar soft delete em agregados?
**A:** Trate como uma operação de negócio com estado específico.

```typescript
export default class Club {
  private _deletedAt?: Date;
  
  public deactivate(reason: string): void {
    if (this.hasActiveMembers()) {
      throw new InvalidOperationException('Cannot deactivate club with active members');
    }
    this._deletedAt = new Date();
    // Emitir Domain Event: ClubDeactivatedEvent
  }
  
  public isActive(): boolean {
    return !this._deletedAt;
  }
}
```

### Q: Como lidar com consultas complexas que cruzam múltiplos agregados?
**A:** Use Query Objects ou Read Models otimizados.

```typescript
// Query otimizada fora do domínio
export interface ClubStatisticsQuery {
  getClubsWithMemberCount(): Promise<ClubStatistics[]>;
  getClubsByRegion(region: string): Promise<ClubSummary[]>;
}

// Implementação na infraestrutura
export class PrismaClubStatisticsQuery implements ClubStatisticsQuery {
  async getClubsWithMemberCount(): Promise<ClubStatistics[]> {
    return this.prisma.club.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { members: { where: { status: 'ACTIVE' } } } }
      }
    });
  }
}
```

## Comandos de Verificação

```bash
# Verificar propriedades públicas em agregados
rg -n "public.*:" src/domain/entities/ --type ts

# Verificar modificações diretas de entidades
rg -n "\.status\s*=" src/application/ --type ts

# Verificar construtores públicos sem validações
rg -A 5 -B 2 "constructor.*public" src/domain/entities/ --type ts

# Verificar use cases sem UnitOfWork para múltiplos agregados
rg -L "UnitOfWork|executeInTransaction" src/application/use-cases/*.ts

# Verificar Domain Events não tratados
rg -n "DomainEvent" src/domain/entities/ --type ts

# Verificar vazamentos de lógica de negócio para Use Cases
rg -n "if.*\.(length|count|status)" src/application/use-cases/ --type ts
```

## Princípio Fineman: "A Simplicidade é o Ápice da Sofisticação"

### Complexidade Eliminada
- ❌ Estados inconsistentes entre entidades
- ❌ Regras de negócio espalhadas
- ❌ Modificações descontroladas
- ❌ Transações complexas

### Simplicidade Conquistada  
- ✅ Um ponto de entrada por agregado
- ✅ Regras centralizadas e claras
- ✅ Estado sempre válido
- ✅ Transações automáticas

**O resultado:** Código mais simples, mais robusto e mais fácil de evoluir.

## Exemplo Completo End-to-End

### Cenário: Sistema de Inscrição em Clube

```typescript
// 1. AGGREGATE ROOT: Club (completo)
export default class Club {
  private readonly _id: string;
  private readonly _members: ClubMembership[];
  private readonly _createdAt: Date;
  private _principalId: string;
  private _maxMembers?: number;
  private _address: Address;
  private _name: string;
  private _domainEvents: DomainEvent[] = [];

  constructor(props: ClubConstructorProps) {
    this._id = props.id;
    this._name = props.name;
    this._address = props.address;
    this._members = props.members || [];
    this._createdAt = props.createdAt;
    this._maxMembers = props.maxMembers;
    this._principalId = props.principalId;
  }

  public static create(props: CreateClubProps, idGenerator: IdGenerator): Club {
    // Validações de negócio
    if (!props.name || props.name.trim().length < 3) {
      throw new InvalidOperationException('Club name is required and must have at least 3 characters.');
    }
    if (!props.address) {
      throw new InvalidOperationException('Address is required.');
    }
    if (props.maxMembers && props.maxMembers < 1) {
      throw new InvalidOperationException('Max members must be greater than 0.');
    }

    const club = new Club({
      id: idGenerator.generate(),
      name: props.name,
      address: props.address,
      members: [],
      createdAt: new Date(),
      maxMembers: props.maxMembers,
      principalId: props.principalId,
    });

    // Domain Event
    club.addDomainEvent(new ClubCreatedEvent(club.id, props.principalId));
    return club;
  }

  public addMember(memberId: string, familyId: string, idGenerator: IdGenerator): void {
    // Verificar se já é membro ativo
    const membership = this.findMembershipByDependantId(memberId);
    if (membership?.isActive()) {
      throw new InvalidOperationException(`Dependant ${memberId} is already an active member of this club.`);
    }

    // Verificar capacidade
    if (this.isAtMaxCapacity()) {
      throw new InvalidOperationException('O clube já atingiu o número máximo de membros.');
    }

    // Operação de negócio
    if (membership) {
      membership.reinstate();
      this.addDomainEvent(new MemberReinstatedEvent(this._id, memberId));
    } else {
      const newMembership = ClubMembership.create({
        clubId: this._id,
        memberId: memberId,
        familyId,
      }, idGenerator);
      this._members.push(newMembership);
      this.addDomainEvent(new MemberAddedToClubEvent(this._id, memberId, familyId));
    }
  }

  public removeMember(memberId: string): void {
    const membership = this.findMembershipByDependantId(memberId);
    if (!membership || !membership.isActive()) {
      throw new EntityNotFoundException('ClubMembership', `${memberId} is not an active member of this club.`);
    }
    membership.revoke();
    this.addDomainEvent(new MemberRemovedFromClubEvent(this._id, memberId));
  }

  // Helper methods
  private findMembershipByDependantId(dependantId: string): ClubMembership | undefined {
    return this._members.find((m) => m.memberId === dependantId);
  }

  public getActiveMembersCount(): number {
    return this._members.filter((m) => m.isActive()).length;
  }

  public isAtMaxCapacity(): boolean {
    if (!this._maxMembers) return false;
    return this.getActiveMembersCount() >= this._maxMembers;
  }

  public hasActiveMembers(): boolean {
    return this.getActiveMembersCount() > 0;
  }

  // Domain Events
  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  // Getters
  get id(): string { return this._id; }
  get principalId(): string { return this._principalId; }
  get name(): string { return this._name; }
  get address(): Address { return this._address; }
  get maxMembers(): number | undefined { return this._maxMembers; }
  get members(): Readonly<ClubMembership[]> { return this._members; }
  get createdAt(): Date { return this._createdAt; }
}
```

```typescript
// 2. USE CASE: Processo completo de aprovação
@Injectable()
export default class ApproveEnrollment {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly _uow: UnitOfWork,
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly _eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: ApproveEnrollmentInput): Promise<void> {
    return await this._uow.executeInTransaction(async () => {
      // 1. Carregar agregados
      const request = await this._uow.enrollmentRequestRepository.findById(input.enrollmentRequestId);
      if (!request) {
        throw new EntityNotFoundException('EnrollmentRequest', input.enrollmentRequestId);
      }

      const club = await this._uow.clubRepository.find(request.clubId);
      if (!club) {
        throw new EntityNotFoundException('Club', request.clubId);
      }

      // 2. Validações de autorização
      if (club.principalId !== input.loggedInUserId) {
        throw new ForbiddenException('User is not authorized to manage this enrollment request.');
      }

      // 3. Validações de negócio (Family)
      const family = await this._uow.familyRepository.find(request.familyId);
      if (!family || !family.isAffiliated()) {
        throw new InvalidOperationException('Cannot approve enrollment for a family that is not affiliated.');
      }

      // 4. Operações de domínio
      club.addMember(request.dependantId, request.familyId, this._idGenerator);
      request.approve();

      // 5. Persistência
      await this._uow.clubRepository.save(club);
      await this._uow.enrollmentRequestRepository.save(request);

      // 6. Publicar eventos de domínio
      await this._eventPublisher.publishEvents([
        ...club.getDomainEvents(),
        ...request.getDomainEvents(),
      ]);

      // 7. Limpar eventos
      club.clearDomainEvents();
      request.clearDomainEvents();
    });
  }
}
```

```typescript
// 3. REPOSITORY: Implementação Prisma completa
@Injectable()
export class PrismaClubRepository implements ClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<Club | null> {
    const clubData = await this.prisma.club.findUnique({
      where: { id },
      include: {
        memberships: {
          where: { status: { not: 'DELETED' } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!clubData) return null;

    return new Club({
      id: clubData.id,
      name: clubData.name,
      address: new Address({
        street: clubData.addressStreet,
        city: clubData.addressCity,
        state: clubData.addressState,
        zipCode: clubData.addressZipCode,
      }),
      members: clubData.memberships.map(m => new ClubMembership({
        id: m.id,
        clubId: m.clubId,
        memberId: m.memberId,
        familyId: m.familyId,
        status: m.status as MembershipStatus,
        createdAt: m.createdAt,
      })),
      createdAt: clubData.createdAt,
      maxMembers: clubData.maxMembers,
      principalId: clubData.principalId,
    });
  }

  async save(club: Club): Promise<Club> {
    const clubData = {
      id: club.id,
      name: club.name,
      addressStreet: club.address.street,
      addressCity: club.address.city,
      addressState: club.address.state,
      addressZipCode: club.address.zipCode,
      maxMembers: club.maxMembers,
      principalId: club.principalId,
    };

    // Upsert club
    await this.prisma.club.upsert({
      where: { id: club.id },
      update: clubData,
      create: { ...clubData, createdAt: club.createdAt },
    });

    // Sync memberships
    for (const membership of club.members) {
      await this.prisma.clubMembership.upsert({
        where: { id: membership.id },
        update: {
          status: membership.status,
        },
        create: {
          id: membership.id,
          clubId: membership.clubId,
          memberId: membership.memberId,
          familyId: membership.familyId,
          status: membership.status,
          createdAt: membership.createdAt,
        },
      });
    }

    return club;
  }

  async findByPrincipalId(principalId: string): Promise<Club | null> {
    // Similar implementation...
  }
}
```

## Monitoramento e Evolução

### Métricas de Qualidade DDD

```typescript
// Exemplo de métricas para monitorar saúde dos agregados
export class DddQualityMetrics {
  // Complexidade ciclomática dos agregados
  measureAggregateComplexity(aggregate: any): number {
    // Contar métodos públicos, condicionais, etc.
  }

  // Coesão das operações
  measureCohesion(aggregate: any): number {
    // Verificar se operações trabalham com os mesmos dados
  }

  // Violações de encapsulamento
  detectEncapsulationViolations(codebase: string[]): Violation[] {
    // Detectar propriedades públicas, modificações diretas, etc.
  }
}
```

### Evolução de Agregados

```typescript
// Strategy para evolução sem quebrar compatibilidade
export class ClubMigrationStrategy {
  async migrateToV2(clubV1: ClubV1): Promise<Club> {
    // Migração segura mantendo invariantes
    const club = new Club({
      id: clubV1.id,
      name: clubV1.name,
      // Novos campos com valores padrão
      maxMembers: clubV1.maxMembers || 50,
      // ...
    });
    
    return club;
  }
}
```

**O resultado:** Código mais simples, mais robusto e mais fácil de evoluir.

## Recursos Adicionais

- [Domain-Driven Design Reference](https://domainlanguage.com/ddd/reference/)
- [Effective Aggregate Design](https://dddcommunity.org/library/vernon_2011/)
- [Martin Fowler on Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html)
- [Event Sourcing and CQRS with Aggregates](https://docs.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)
- [NestJS Domain Events](https://docs.nestjs.com/recipes/cqrs#events)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)