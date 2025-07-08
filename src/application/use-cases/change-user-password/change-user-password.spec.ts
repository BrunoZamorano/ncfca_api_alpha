import User from '@/domain/entities/user/user';

import ChangeUserPassword from '@/application/use-cases/change-user-password/change-user-password';

import UserRepositoryMemory from '@/infraestructure/repositories/user-repository-memory';
import AnemicHashingService from '@/infraestructure/services/anemic-hashing-service';
import UuidGenerator from '@/infraestructure/services/uuid-generator';
import UserFactory from '@/domain/factories/user.factory';
import InMemoryDatabase from '@/infraestructure/database/in-memory.database';

describe('ChangeUserPassword', () => {
  const db = InMemoryDatabase.getInstance();
  const DEFAULT_ID = '1';
  let userRepository: UserRepositoryMemory;
  let hashingService: AnemicHashingService;
  let changeUserPassword: ChangeUserPassword;
  const idGenerator = new UuidGenerator();

  beforeEach(() => {
    db.beginTransaction();
    hashingService = new AnemicHashingService();
    const userFactory = new UserFactory(hashingService, idGenerator);
    userRepository = new UserRepositoryMemory();
    userRepository.populate(userFactory, { id: DEFAULT_ID, password: User.DEFAULT_PASSWORD }, 1);
    changeUserPassword = new ChangeUserPassword(userRepository, hashingService);
  });

  afterEach(function () {
    db.rollback();
  });

  it('Deve trocar a senha do usuário', async function () {
    const input = {
      id: DEFAULT_ID,
      password: User.DEFAULT_PASSWORD,
      newPassword: '<NEW_P@ssw0rd>',
    };
    const output = await changeUserPassword.execute(input);
    expect(output).toBe(void 0);
    const user = await userRepository.find(DEFAULT_ID);
    if (!user) throw new Error('USER_NOT_FOUND');
    expect(hashingService.compare(input.newPassword, user.password)).toBe(true);
  });

  it('Não deve trocar a senha do usuário se as senhas forem iguais', async function () {
    const input = {
      id: DEFAULT_ID,
      password: User.DEFAULT_PASSWORD,
      newPassword: User.DEFAULT_PASSWORD,
    };
    await expect(() => changeUserPassword.execute(input)).rejects.toThrow(ChangeUserPassword.errorCodes.SAME_PASSWORD);
    const user = await userRepository.find(DEFAULT_ID);
    if (!user) throw new Error('USER_NOT_FOUND');
    expect(hashingService.compare(input.password, user.password)).toBe(true);
  });
});
