import { DomainException } from '@/domain/exceptions/domain-exception';
import Email from '@/domain/value-objects/email/email';

describe('Email Value Object', () => {
  it('Deve criar um Email com um endereço válido', () => {
    const email = new Email('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('Deve converter o email para minúsculas', () => {
    const email = new Email('TEST@EXAMPLE.COM');
    expect(email.value).toBe('test@example.com');
  });

  it('Deve lançar uma exceção para um formato de email inválido', () => {
    expect(() => new Email('invalid-email')).toThrow(DomainException);
    expect(() => new Email('test@invalid')).toThrow(DomainException);
    expect(() => new Email('test@.com')).toThrow(DomainException);
  });
});
