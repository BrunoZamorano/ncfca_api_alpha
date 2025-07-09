import Dependant from './dependant';
import { DomainException } from '@/domain/exceptions/domain-exception';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';
import Email from '@/domain/value-objects/email/email';

describe('Dependant Entity', () => {
  const validProps = {
    id: 'dependant-1',
    firstName: 'John',
    lastName: 'Doe',
    birthdate: new Birthdate('2010-05-15'),
    relationship: DependantRelationship.Son,
    sex: Sex.Male,
    email: new Email('john.jr@example.com'),
    phone: '11999998888',
  };

  it('Deve criar uma instância de Dependant com sucesso', () => {
    const dependant = new Dependant(validProps);

    expect(dependant).toBeInstanceOf(Dependant);
    expect(dependant.firstName).toBe('John');
    expect(dependant.lastName).toBe('Doe');
    expect(dependant.sex).toBe(Sex.Male);
    expect(dependant.email).toBe('john.jr@example.com');
  });

  it('Deve lançar uma exceção se o primeiro nome for inválido', () => {
    expect(() => new Dependant({ ...validProps, firstName: '' })).toThrow('First name is required');
    expect(() => new Dependant({ ...validProps, firstName: 'J' })).toThrow('First name is required');
  });

  it('Deve lançar uma exceção se o sobrenome for inválido', () => {
    expect(() => new Dependant({ ...validProps, lastName: '' })).toThrow('Last name is required');
  });

  describe('updateInfo', () => {
    it('Deve atualizar todas as informações do dependente corretamente', () => {
      const dependant = new Dependant(validProps);
      const updatePayload = {
        firstName: 'Jane',
        lastName: 'Smith',
        birthdate: '2012-10-20',
        relationship: DependantRelationship.Daugter,
        sex: Sex.Female,
        email: 'jane.smith@example.com',
        phone: '11777776666',
      };

      dependant.updateInfo(updatePayload);

      expect(dependant.firstName).toBe(updatePayload.firstName);
      expect(dependant.lastName).toBe(updatePayload.lastName);
      expect(dependant.birthdate).toEqual(new Date(updatePayload.birthdate));
      expect(dependant.relationship).toBe(updatePayload.relationship);
      expect(dependant.sex).toBe(updatePayload.sex);
      expect(dependant.email).toBe(updatePayload.email);
      expect(dependant.phone).toBe(updatePayload.phone);
    });

    it('Deve lançar uma exceção ao tentar atualizar com dados inválidos', () => {
      const dependant = new Dependant(validProps);
      expect(() => dependant.updateInfo({ firstName: 'A' })).toThrow(DomainException);
      expect(() => dependant.updateInfo({ birthdate: 'invalid-date' })).toThrow(DomainException);
      expect(() => dependant.updateInfo({ email: 'invalid-email' })).toThrow(DomainException);
    });
  });
});
