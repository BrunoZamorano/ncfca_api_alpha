import { DomainException } from '@/domain/exceptions/domain-exception';
import HashingService from '@/domain/services/hashing-service';

import Password from './password';

const mockHashingService: HashingService = {
  compare: jest.fn((plainText: string, hash: string) => `hashed_${plainText}` === hash),
  hash: jest.fn((value: string) => `hashed_${value}`),
};

describe('Password Value Object', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Deve criar uma instância de Password com sucesso para uma senha válida', () => {
      const validPassword = 'Password123';
      const password = Password.create(validPassword, mockHashingService);
      expect(password).toBeInstanceOf(Password);
      expect(password.value).toBe(`hashed_${validPassword}`);
      expect(mockHashingService.hash).toHaveBeenCalledWith(validPassword);
    });

    it('Deve lançar uma exceção se a senha for muito curta', () => {
      const shortPassword = 'Pass123';
      expect(() => {
        Password.create(shortPassword, mockHashingService);
      }).toThrow(new DomainException(Password.errorCodes.PASSWORD_TOO_SHORT));
      expect(mockHashingService.hash).not.toHaveBeenCalled();
    });

    it('Deve lançar uma exceção se a senha não atender aos critérios de complexidade', () => {
      const noUpperCase = 'password123';
      const noLowerCase = 'PASSWORD123';
      const noNumber = 'Password';
      expect(() => {
        Password.create(noUpperCase, mockHashingService);
      }).toThrow(new DomainException(Password.errorCodes.PASSWORD_DOES_NOT_MEET_CRITERIA));
      expect(() => {
        Password.create(noLowerCase, mockHashingService);
      }).toThrow(new DomainException(Password.errorCodes.PASSWORD_DOES_NOT_MEET_CRITERIA));
      expect(() => {
        Password.create(noNumber, mockHashingService);
      }).toThrow(new DomainException(Password.errorCodes.PASSWORD_DOES_NOT_MEET_CRITERIA));
      expect(mockHashingService.hash).not.toHaveBeenCalled();
    });
  });

  describe('fromHash', () => {
    it('Deve recriar uma instância de Password a partir de um hash existente', () => {
      const existingHash = 'some_pre_existing_hash_value';
      const password = Password.fromHash(existingHash);
      expect(password).toBeInstanceOf(Password);
      expect(password.value).toBe(existingHash);
      expect(mockHashingService.hash).not.toHaveBeenCalled();
    });
  });

  describe('compare', () => {
    it('Deve retornar true quando as senhas correspondem', () => {
      const plainText = 'Password123';
      const hash = mockHashingService.hash(plainText);
      const password = Password.fromHash(hash);
      const result = password.compare(plainText, mockHashingService);
      expect(result).toBe(true);
      expect(mockHashingService.compare).toHaveBeenCalledWith(plainText, hash);
    });

    it('Deve retornar false quando as senhas não correspondem', () => {
      const correctPassword = 'Password123';
      const wrongPassword = 'WrongPassword456';
      const hash = mockHashingService.hash(correctPassword);
      const password = Password.fromHash(hash);
      const result = password.compare(wrongPassword, mockHashingService);
      expect(result).toBe(false);
      expect(mockHashingService.compare).toHaveBeenCalledWith(wrongPassword, hash);
    });
  });
});
