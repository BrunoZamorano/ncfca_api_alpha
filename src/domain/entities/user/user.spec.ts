import User from './user';
import { UserRoles } from '../../enums/user-roles';
import Cpf from '@/domain/value-objects/cpf/cpf';

describe('Usuário', function () {
  it('Deve criar um Usuário', function () {
    const props = {
      firstName: 'test',
      lastName: 'test',
      password: '<PASSWORD>',
      email: '<EMAIL>',
      roles: [UserRoles.DONO_DE_CLUBE],
      id: '123',
    };
    const user = new User(props);
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
      password: '<PASSWORD>',
      email: '<EMAIL>',
      roles: [UserRoles.DONO_DE_CLUBE, UserRoles.DONO_DE_CLUBE],
      id: '123',
    };
    expect(() => new User(props)).toThrow(User.errorCodes.DUPLICATED_ROLES);
  });

  it('Não deve criar um Usuário com cpf inválido', function () {
    const props = {
      firstName: 'test',
      lastName: 'test',
      password: '<PASSWORD>',
      email: '<EMAIL>',
      cpf: '123123123',
      id: '123',
    };
    expect(() => new User(props)).toThrow(Cpf.errorCodes.INVALID_CPF);
  });
});
