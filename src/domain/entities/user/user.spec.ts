import HashingService from '@/domain/services/hashing-service';
import { UserRoles } from '@/domain/enums/user-roles';
import Password from '@/domain/value-objects/password/password';
import Cpf from '@/domain/value-objects/cpf/cpf';

import User from './user';
import UserFactory from '@/domain/factories/user.factory';

describe('Usuário', function () {
  const mockHashingService: HashingService = {
    compare: jest.fn((plainText: string, hash: string) => `hashed_${plainText}` === hash),
    hash: jest.fn((value: string) => `hashed_${value}`),
  };
  const userFactory = new UserFactory(mockHashingService, { generate: () => '1' });

  it('Deve criar um Usuário', function () {
    const props = {
      firstName: 'test',
      lastName: 'test',
      password: User.DEFAULT_PASSWORD,
      email: User.DEFAULT_EMAIL,
      roles: [UserRoles.DONO_DE_CLUBE],
      id: '123',
    };
    const user = userFactory.create(props);
    expect(user).toBeDefined();
    expect(user.firstName).toBe(props.firstName);
    expect(user.lastName).toBe(props.lastName);
    expect(user.email).toBe(props.email);
    expect(user.roles).toContain(UserRoles.SEM_FUNCAO);
    expect(user.id).toBe(props.id);
  });

  it('Não deve criar um Usuário duplicando roles', function () {
    const props = {
      firstName: 'test',
      lastName: 'test',
      email: User.DEFAULT_EMAIL,
      roles: [UserRoles.DONO_DE_CLUBE, UserRoles.DONO_DE_CLUBE],
    };
    expect(() => userFactory.create(props)).toThrow(User.errorCodes.DUPLICATED_ROLES);
  });

  it('Não deve criar um Usuário com cpf inválido', function () {
    const props = {
      firstName: 'test',
      lastName: 'test',
      email: User.DEFAULT_EMAIL,
      cpf: '123123123',
    };
    expect(() => userFactory.create(props)).toThrow(Cpf.errorCodes.INVALID_CPF);
  });
});
