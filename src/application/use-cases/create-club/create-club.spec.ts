import Family from '@/domain/entities/family/family';
import Club from '@/domain/entities/club/club';
import User from '@/domain/entities/user/user';

import FamilyRepositoryMemory from '@/infraestructure/repositories/family.repository-memory';
import ClubRepositoryMemory from '@/infraestructure/repositories/club-repository-memory';
import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import CreateClub from '@/application/use-cases/create-club/create-club';
import UserFactory from '@/domain/factories/user.factory';
import HashingService from '@/domain/services/hashing-service';
import { UnitOfWorkMemory } from '@/infraestructure/services/unit-of-work.memory';
import TransactionRepository from '@/domain/repositories/transaction.repository';
import EnrollmentRequestRepository from '@/domain/repositories/enrollment-request-repository';

describe('Create Club', () => {
  const DEFAULT_ID = '1';
  let userRepository: UserRepositoryMemory;
  let clubRepository: ClubRepositoryMemory;
  let familyRepository: FamilyRepositoryMemory;
  let createClub: CreateClub;

  beforeEach(() => {
    const idGenerator = { generate: () => DEFAULT_ID };
    const hashingService = { hash: () => DEFAULT_ID } as unknown as HashingService;
    const userFactory = new UserFactory(hashingService, idGenerator);
    familyRepository = new FamilyRepositoryMemory([new Family({ id: DEFAULT_ID, holderId: DEFAULT_ID })]);
    userRepository = new UserRepositoryMemory();
    userRepository.populate(userFactory, { id: DEFAULT_ID }, 1);
    clubRepository = new ClubRepositoryMemory({ clubs: [] });
    const uow = new UnitOfWorkMemory(
      userRepository,
      clubRepository,
      familyRepository,
      {} as TransactionRepository,
      {} as EnrollmentRequestRepository,
    );
    createClub = new CreateClub(idGenerator, uow);
  });

  it('Deve criar um clube', async function () {
    const input = {
      afiliatedFamilies: [DEFAULT_ID],
      loggedInUserId: DEFAULT_ID,
      name: Club.DEFAULT_NAME,
      city: Club.DEFAULT_CITY,
    };
    const output = await createClub.execute(input);
    expect(output.ownerId).toBe(input.loggedInUserId);
    expect(output.name).toBe(input.name);
    expect(output.city).toBe(input.city);
    expect(output.id).toBe(DEFAULT_ID);
    const club = await clubRepository.find(DEFAULT_ID);
    if (!club) throw new Error('CLUB_NOT_CREATED');
    expect(club.affiliatedFamilies).toContain(DEFAULT_ID);
    expect(club.ownerId).toBe(input.loggedInUserId);
    expect(club.name).toBe(input.name);
    expect(club.city).toBe(input.city);
    expect(club.id).toBe(DEFAULT_ID);
  });
});
