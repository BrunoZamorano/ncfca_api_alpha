import Address, { AddressProps } from './address';
import { DomainException } from '@/domain/exceptions/domain-exception';

describe('Address Value Object', () => {
  const validProps: AddressProps = {
    street: 'Rua Principal',
    number: '123',
    district: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '12345-678',
    complement: 'Apto 101',
  };

  it('Deve criar uma instância de Address com sucesso para propriedades válidas', () => {
    const address = new Address(validProps);
    expect(address).toBeInstanceOf(Address);
    expect(address.state).toBe('SP');
    expect(address.street).toBe('Rua Principal');
    expect(address.zipCode).toBe('12345678');
    expect(address.complement).toBe('Apto 101');
  });

  it('Deve criar uma instância de Address mesmo sem um complemento', () => {
    const { complement, ...propsWithoutComplement } = validProps;
    const address = new Address(propsWithoutComplement);
    expect(address).toBeInstanceOf(Address);
    expect(address.complement).toBeUndefined();
  });

  describe('Validações de Domínio', () => {
    it('Deve lançar uma exceção se o CEP (zipCode) for inválido', () => {
      const invalidProps = { ...validProps, zipCode: '12345' };
      expect(() => new Address(invalidProps)).toThrow(new DomainException('Invalid zip code format.'));
    });

    it('Deve lançar uma exceção se a rua (street) for muito curta', () => {
      const invalidProps = { ...validProps, street: 'R' };
      expect(() => new Address(invalidProps)).toThrow(new DomainException('Street is required.'));
    });

    it('Deve lançar uma exceção se o estado (state) não tiver 2 caracteres', () => {
      const invalidProps = { ...validProps, state: 'SAO PAULO' };
      expect(() => new Address(invalidProps)).toThrow(new DomainException('State must be a 2-character abbreviation.'));
    });
  });
});
