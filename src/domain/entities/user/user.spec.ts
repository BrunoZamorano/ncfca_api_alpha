import { DomainException } from '@/domain/exceptions/domain-exception';
import HashingService from '@/domain/services/hashing-service';
import { UserRoles } from '@/domain/enums/user-roles';
import Password from '@/domain/value-objects/password/password';
import Cpf from '@/domain/value-objects/cpf/cpf';

import User from './user';

describe('User Entity', () => {
  const mockHashingService: HashingService = {
    compare: (plainText: string, hash: string) => `hashed_${plainText}` === hash,
    hash: (value: string) => `hashed_${value}`,
  };
  let user: User;

  beforeEach(() => {
    user = new User({
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '11999998888',
      cpf: new Cpf(),
      password: Password.create('Password123', mockHashingService),
    });
  });

  describe('updateProfile', () => {
    it('Deve atualizar o nome, sobrenome, email e telefone do usuário', () => {
      const updatePayload = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '11777776666',
      };
      user.updateProfile(updatePayload);
      expect(user.firstName).toBe(updatePayload.firstName);
      expect(user.lastName).toBe(updatePayload.lastName);
      expect(user.email).toBe(updatePayload.email);
      expect(user.phone).toBe(updatePayload.phone);
    });

    it('Deve atualizar apenas os campos fornecidos', () => {
      const partialUpdate = { firstName: 'James' };
      user.updateProfile(partialUpdate);
      expect(user.firstName).toBe('James');
      expect(user.lastName).toBe('Doe');
    });
  });

  describe('changePassword', () => {
    it('Deve alterar a senha com sucesso quando a senha antiga está correta', () => {
      const oldPassword = 'Password123';
      const newPassword = 'NewPassword456';
      user.changePassword(oldPassword, newPassword, mockHashingService);
      expect(user.password).toBe(mockHashingService.hash(newPassword));
      expect(user.password).not.toBe(mockHashingService.hash(oldPassword));
    });

    it('Deve lançar DomainException se a nova senha for igual à antiga', () => {
      const oldPassword = 'Password123';
      const newPassword = 'Password123';
      expect(() => {
        user.changePassword(oldPassword, newPassword, mockHashingService);
      }).toThrow(new DomainException(User.errorCodes.SAME_PASSWORD));
    });

    it('Deve lançar DomainException se a senha antiga fornecida estiver incorreta', () => {
      const wrongOldPassword = 'WrongPassword';
      const newPassword = 'NewPassword456';
      expect(() => {
        user.changePassword(wrongOldPassword, newPassword, mockHashingService);
      }).toThrow(new DomainException(User.errorCodes.INVALID_CREDENTIALS));
    });
  });

  describe('addRoles', () => {
    it('Deve adicionar novas roles ao usuário', () => {
      expect(user.roles).toEqual([]);
      user.addRoles([UserRoles.DONO_DE_CLUBE]);
      expect(user.roles).toEqual([UserRoles.DONO_DE_CLUBE]);
    });

    it('Deve lançar um erro ao tentar adicionar uma role duplicada', () => {
      user.addRoles([UserRoles.DONO_DE_CLUBE]);
      const action = () => user.addRoles([UserRoles.SEM_FUNCAO, UserRoles.DONO_DE_CLUBE]);
      expect(action).toThrow(new Error(User.errorCodes.DUPLICATED_ROLES));
    });
  });
});