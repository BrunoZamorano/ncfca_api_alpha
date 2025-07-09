import IdGenerator from '@/application/services/id-generator';

import HashingService from '@/domain/services/hashing-service';
import { UserRoles } from '@/domain/enums/user-roles';
import Cpf from '@/domain/value-objects/cpf/cpf';
import User from '@/domain/entities/user/user';

import { DomainException } from '../exceptions/domain-exception';
import UserFactory from './user.factory';

describe('UserFactory', () => {
  const mockHashingService: HashingService = {
    compare: jest.fn(),
    hash: (value: string) => `hashed_${value}`,
  };

  const mockIdGenerator: IdGenerator = {
    generate: () => 'mock-uuid-12345',
  };

  let userFactory: UserFactory;

  beforeEach(() => {
    userFactory = new UserFactory(mockHashingService, mockIdGenerator);
  });

  it('Deve criar um usuário com sucesso usando propriedades completas', () => {
    const props = {
      id: 'custom-id',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: 'Password123',
      phone: '11987654321',
      cpf: Cpf.VALID_CPF,
      roles: [UserRoles.DONO_DE_CLUBE],
    };
    const user = userFactory.create(props);
    expect(user).toBeInstanceOf(User);
    expect(user.id).toBe('custom-id');
    expect(user.firstName).toBe('Jane');
    expect(user.email).toBe('jane.smith@example.com');
    expect(user.password).toBe('hashed_Password123');
    expect(user.roles).toEqual([UserRoles.DONO_DE_CLUBE, UserRoles.SEM_FUNCAO]);
  });

  it('Deve criar um usuário com valores padrão quando nenhuma propriedade é fornecida', () => {
    const user = userFactory.create();
    expect(user).toBeInstanceOf(User);
    expect(user.id).toBe('mock-uuid-12345');
    expect(user.firstName).toBe(User.DEFAULT_FIRST_NAME);
    expect(user.lastName).toBe(User.DEFAULT_LAST_NAME);
    expect(user.email).toBe(User.DEFAULT_EMAIL);
    expect(user.password).toBe(`hashed_${User.DEFAULT_PASSWORD}`);
    expect(user.roles).toEqual([UserRoles.SEM_FUNCAO]);
  });

  it('Deve lançar DomainException se o CPF fornecido for inválido', () => {
    const propsWithInvalidCpf = { cpf: '11111111111' };
    expect(() => {
      userFactory.create(propsWithInvalidCpf);
    }).toThrow(new DomainException(Cpf.errorCodes.INVALID_CPF));
  });

  it('Deve lançar DomainException se a senha fornecida for inválida', () => {
    const propsWithInvalidPassword = { password: 'short' };
    expect(() => {
      userFactory.create(propsWithInvalidPassword);
    }).toThrow(DomainException);
  });

  it('Deve garantir que a role SEM_FUNCAO seja adicionada mesmo se outras roles forem fornecidas', () => {
    const props = { roles: [UserRoles.DONO_DE_CLUBE] };
    const user = userFactory.create(props);
    expect(user.roles).toContain(UserRoles.DONO_DE_CLUBE);
    expect(user.roles).toContain(UserRoles.SEM_FUNCAO);
  });
});
