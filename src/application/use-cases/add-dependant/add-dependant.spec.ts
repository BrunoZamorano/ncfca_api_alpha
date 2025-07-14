import { Sex } from '@/domain/enums/sex';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { ForbiddenException } from '@nestjs/common';
import Family from '@/domain/entities/family/family';
import { FamilyStatus } from '@/domain/enums/family-status';
import AddDependant from '@/application/use-cases/add-dependant/add-dependant';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { UnitOfWorkMemory } from '@/infraestructure/services/unit-of-work.memory';
import UuidGenerator from '@/infraestructure/services/uuid-generator';
import { Test, TestingModule } from '@nestjs/testing';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';
import {
  CLUB_REPOSITORY,
  FAMILY_REPOSITORY,
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from '@/shared/constants/repository-constants';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import TransactionRepositoryMemory from '@/infraestructure/repositories/transaction.memory-repository';
import { ENROLLMENT_REQUEST_REPOSITORY } from '@/domain/repositories/enrollment-request-repository';
import EnrollmentRequestRepositoryMemory from '@/infraestructure/repositories/enrollment-request.repository.memory';
import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
import User from '@/domain/entities/user/user';
import Email from '@/domain/value-objects/email/email';
import Cpf from '@/domain/value-objects/cpf/cpf';
import Password from '@/domain/value-objects/password/password';
import HashingService from '@/domain/services/hashing-service';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

const mockHashingService: HashingService = {
  compare: (plainText: string, hash: string) => `hashed_${plainText}` === hash,
  hash: (value: string) => `hashed_${value}`,
};

describe('AddDependantUseCase (Integration)', () => {
  let useCase: AddDependant;
  let db: InMemoryDatabase;

  const holderId = 'user-1';
  const familyId = 'family-1';

  beforeEach(async () => {
    db = InMemoryDatabase.getInstance();
    db.reset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddDependant,
        { provide: USER_REPOSITORY, useClass: UserRepositoryMemory },
        { provide: FAMILY_REPOSITORY, useFactory: () => new FamilyRepositoryMemory([]) },
        { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepositoryMemory },
        { provide: CLUB_REPOSITORY, useFactory: () => new ClubRepositoryMemory({ clubs: [] }) },
        { provide: ENROLLMENT_REQUEST_REPOSITORY, useClass: EnrollmentRequestRepositoryMemory },
        { provide: UNIT_OF_WORK, useClass: UnitOfWorkMemory },
        { provide: ID_GENERATOR, useClass: UuidGenerator },
      ],
    }).compile();

    useCase = module.get<AddDependant>(AddDependant);

    db.families.push(new Family({ id: familyId, holderId, status: FamilyStatus.AFFILIATED }));
    db.users.push(
      new User({
        id: holderId,
        rg: User.DEFAULT_RG,
        firstName: 'John',
        lastName: 'Doe',
        email: new Email('john.doe@example.com'),
        phone: '11999998888',
        cpf: new Cpf(),
        password: Password.create('Password123', mockHashingService),
      }),
    );
  });

  const validInput = {
    loggedInUserId: holderId,
    firstName: 'John',
    lastName: 'Doe',
    birthdate: '2010-01-01',
    relationship: DependantRelationship.SON,
    sex: Sex.MALE,
  };

  it('Deve adicionar um dependente a uma família com sucesso', async () => {
    await useCase.execute(validInput);
    const family = await db.families.find((f) => f.id === familyId);
    expect(family?.dependants).toHaveLength(1);
    expect(family?.dependants[0].firstName).toBe('John');
  });

  it('Deve lançar EntityNotFoundException se o usuário tentar adicionar um dependente a uma família que não é sua', async () => {
    const anotherUserInput = { ...validInput, loggedInUserId: 'another-user-id' };
    await expect(useCase.execute(anotherUserInput)).rejects.toThrow(EntityNotFoundException);
  });

  it('Deve lançar ForbiddenException se a família não estiver afiliada', async () => {
    const notAffiliatedFamilyId = 'not-affiliated-family';
    const notAffiliatedHolderId = 'not-affiliated-user';
    db.families.push(
      new Family({
        id: notAffiliatedFamilyId,
        holderId: notAffiliatedHolderId,
        status: FamilyStatus.NOT_AFFILIATED,
      }),
    );
    db.users.push(
      new User({
        id: notAffiliatedHolderId,
        rg: User.DEFAULT_RG,
        firstName: 'Jane',
        lastName: 'Smith',
        email: new Email('jane.smith@example.com'),
        phone: '11999997777',
        cpf: new Cpf(),
        password: Password.create('Password123', mockHashingService),
      }),
    );
    const notAffiliatedInput = {
      ...validInput,
      loggedInUserId: notAffiliatedHolderId,
    };
    await expect(useCase.execute(notAffiliatedInput)).rejects.toThrow(ForbiddenException);
  });

  it('Deve permitir adicionar dependente apenas para família afiliada', async () => {
    const family = db.families.find((f) => f.id === familyId);
    expect(family?.status).toBe(FamilyStatus.AFFILIATED);
    await useCase.execute(validInput);
    const updatedFamily = db.families.find((f) => f.id === familyId);
    expect(updatedFamily?.dependants).toHaveLength(1);
    expect(updatedFamily?.dependants[0].firstName).toBe('John');
  });
});
