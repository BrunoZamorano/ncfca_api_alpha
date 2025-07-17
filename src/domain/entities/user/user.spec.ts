import { DomainException } from '@/domain/exceptions/domain-exception';
import HashingService from '@/domain/services/hashing-service';
import Cpf from '@/domain/value-objects/cpf/cpf';
import User from './user';
import IdGenerator from '@/application/services/id-generator';
import Address from '@/domain/value-objects/address/address';
import { UserRoles } from '@/domain/enums/user-roles';

// Mock dos serviços para isolar a entidade User nos testes
const mockHashingService: HashingService = {
  compare: (plainText: string, hash: string) => `hashed_${plainText}` === hash,
  hash: (value: string) => `hashed_${value}`,
};

const mockIdGenerator: IdGenerator = {
  generate: () => 'mock-uuid-12345',
};

describe('User Entity', () => {
  describe('Creation (User.create)', () => {
    it('deve criar um usuário com sucesso usando o método de fábrica estático', () => {
      const props = {
        firstName: 'Bruno',
        lastName: 'Zamorano',
        email: 'bzam1204@gmail.com',
        password: 'Password123',
        phone: '95991724765',
        cpf: Cpf.VALID_CPF,
      };

      const user = User.create(props, mockIdGenerator, mockHashingService);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe('mock-uuid-12345');
      expect(user.firstName).toBe('Bruno');
      expect(user.email).toBe('bzam1204@gmail.com');
      expect(user.password).toBe('hashed_Password123'); // Verifica se o hashing foi aplicado
      expect(user.roles).toContain(UserRoles.SEM_FUNCAO);
    });

    it('deve garantir que a role SEM_FUNCAO seja adicionada mesmo se outras roles forem fornecidas', () => {
      const user = User.create({ roles: [UserRoles.DONO_DE_CLUBE] }, mockIdGenerator, mockHashingService);
      expect(user.roles).toHaveLength(2);
      expect(user.roles).toEqual(expect.arrayContaining([UserRoles.DONO_DE_CLUBE, UserRoles.SEM_FUNCAO]));
    });

    it('deve lançar DomainException para um e-mail inválido', () => {
      expect(() => {
        User.create({ email: 'email-invalido' }, mockIdGenerator, mockHashingService);
      }).toThrow(new DomainException('Invalid email'));
    });
  });

  describe('Business Logic', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({ password: 'Password123' }, mockIdGenerator, mockHashingService);
    });

    it('deve alterar a senha com sucesso quando a senha antiga está correta', () => {
      const oldPassword = 'Password123';
      const newPassword = 'NewPassword456';

      user.changePassword(oldPassword, newPassword, mockHashingService);

      expect(user.password).toBe(mockHashingService.hash(newPassword));
      expect(user.password).not.toBe(mockHashingService.hash(oldPassword));
    });

    it('deve lançar DomainException se a nova senha for igual à antiga', () => {
      const oldPassword = 'Password123';
      const newPassword = 'Password123';

      expect(() => {
        user.changePassword(oldPassword, newPassword, mockHashingService);
      }).toThrow(new DomainException('New password cannot be the same as the old password.'));
    });

    it('deve lançar DomainException se a senha antiga fornecida estiver incorreta', () => {
      const wrongOldPassword = 'WrongPassword';
      const newPassword = 'NewPassword456';

      expect(() => {
        user.changePassword(wrongOldPassword, newPassword, mockHashingService);
      }).toThrow(new DomainException('Invalid credentials.'));
    });

    it('deve atribuir roles, garantindo SEM_FUNCAO e sem duplicatas', () => {
      user.assignRoles([UserRoles.ADMIN, UserRoles.DONO_DE_CLUBE, UserRoles.ADMIN]);
      expect(user.roles).toHaveLength(3);
      expect(user.roles).toEqual(
        expect.arrayContaining([UserRoles.ADMIN, UserRoles.DONO_DE_CLUBE, UserRoles.SEM_FUNCAO]),
      );
    });

    it('deve revogar uma role com sucesso', () => {
      user.assignRoles([UserRoles.ADMIN, UserRoles.DONO_DE_CLUBE]);
      user.revokeRole(UserRoles.ADMIN);
      expect(user.roles).not.toContain(UserRoles.ADMIN);
      expect(user.roles).toContain(UserRoles.DONO_DE_CLUBE);
    });

    it('deve lançar uma exceção ao tentar revogar a role SEM_FUNCAO', () => {
      expect(() => user.revokeRole(UserRoles.SEM_FUNCAO)).toThrow(
        new DomainException('Cannot revoke the default role.'),
      );
    });

    it('deve atualizar o perfil do usuário corretamente', () => {
      const updatePayload = {
        firstName: 'Bruno Atualizado',
        address: {
          street: 'Nova Rua',
          number: '123',
          district: 'Novo Bairro',
          city: 'Boa Vista',
          state: 'RR',
          zipCode: '69300-000',
        },
      };
      user.updateProfile(updatePayload);
      expect(user.firstName).toBe('Bruno Atualizado');
      expect(user.address).toBeInstanceOf(Address);
      expect(user.address.street).toBe('Nova Rua');
    });
  });
});
