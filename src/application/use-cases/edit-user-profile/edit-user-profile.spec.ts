import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import EditUserProfile from './edit-user-profile';
import UserFactory from '@/domain/factories/user.factory';
import AnemicHashingService from '@/infraestructure/services/anemic-hashing-service';

describe('Editar Perfil do Usuário', () => {
  const DEFAULT_ID = '1';
  let userRepository: UserRepositoryMemory;
  let editUserProfile: EditUserProfile;
  let hashingService: AnemicHashingService;
  const idGenerator = { generate: () => DEFAULT_ID };

  beforeEach(() => {
    hashingService = new AnemicHashingService();
    const userFactory = new UserFactory(hashingService, idGenerator);
    userRepository = new UserRepositoryMemory();
    userRepository.populate(userFactory, { id: DEFAULT_ID }, 1);
    editUserProfile = new EditUserProfile(userRepository);
  });

  it('Deve editar o perfil do usuário', async function () {
    const input = {
      firstName: 'augustus',
      lastName: 'nicodemus',
      phone: '999999999',
      email: 'nicodemus@email.com',
      id: DEFAULT_ID,
    };
    const output = await editUserProfile.execute(input);
    expect(output.firstName).toBe(input.firstName);
    expect(output.lastName).toBe(input.lastName);
    expect(output.phone).toBe(input.phone);
    expect(output.email).toBe(input.email);
    const user = await userRepository.find(DEFAULT_ID);
    if (!user) throw new Error('CLUB_NOT_CREATED');
    expect(user.firstName).toBe(input.firstName);
    expect(user.lastName).toBe(input.lastName);
    expect(user.phone).toBe(input.phone);
    expect(user.email).toBe(input.email);
  });
});
