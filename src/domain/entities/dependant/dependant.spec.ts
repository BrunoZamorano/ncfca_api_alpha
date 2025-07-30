import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { DomainException } from '@/domain/exceptions/domain-exception';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import { Sex } from '@/domain/enums/sex';
import Email from '@/domain/value-objects/email/email';

import Dependant from './dependant';

describe('Dependant Entity', () => {
  const validProps = {
    relationship: DependantRelationship.SON,
    birthdate: new Birthdate('2010-05-15'),
    firstName: 'John',
    lastName: 'Doe',
    phone: '11999998888',
    email: new Email('john.jr@example.com'),
    sex: Sex.MALE,
    id: 'dependant-1',
  };

  it('Deve criar uma instância de Dependant com sucesso', () => {
    const dependant = new Dependant(validProps);
    expect(dependant).toBeInstanceOf(Dependant);
    expect(dependant.relationship).toBe(validProps.relationship);
    expect(dependant.birthdate).toEqual(validProps.birthdate.value);
    expect(dependant.firstName).toBe(validProps.firstName);
    expect(dependant.lastName).toBe(validProps.lastName);
    expect(dependant.phone).toBe(validProps.phone);
    expect(dependant.email).toBe(validProps.email.value);
    expect(dependant.sex).toBe(validProps.sex);
    expect(dependant.id).toBe(validProps.id);
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
        relationship: DependantRelationship.DAUGHTER,
        birthdate: '2012-10-20',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '11777776666',
        email: 'jane.smith@example.com',
        sex: Sex.FEMALE,
      };
      dependant.updateInfo(updatePayload);
      expect(dependant.relationship).toBe(updatePayload.relationship);
      expect(dependant.birthdate).toEqual(new Date(updatePayload.birthdate));
      expect(dependant.firstName).toBe(updatePayload.firstName);
      expect(dependant.lastName).toBe(updatePayload.lastName);
      expect(dependant.phone).toBe(updatePayload.phone);
      expect(dependant.email).toBe(updatePayload.email);
      expect(dependant.sex).toBe(updatePayload.sex);
    });

    it('Deve lançar uma exceção ao tentar atualizar com dados inválidos', () => {
      const dependant = new Dependant(validProps);
      expect(() => dependant.updateInfo({ firstName: 'A' })).toThrow(DomainException);
      expect(() => dependant.updateInfo({ birthdate: 'invalid-date' })).toThrow(DomainException);
      expect(() => dependant.updateInfo({ email: 'invalid-email' })).toThrow(DomainException);
    });
  });
});
