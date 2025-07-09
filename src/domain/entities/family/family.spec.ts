import Family from './family';
import { FamilyStatus } from '@/domain/enums/family-status';
import Dependant from '@/domain/entities/dependant/dependant';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import { DomainException } from '@/domain/exceptions/domain-exception';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';
import Email from '@/domain/value-objects/email/email';

describe('Família', function () {
  const createValidDependant = (id: string, name: string) => {
    return new Dependant({
      id,
      firstName: name,
      lastName: 'Doe',
      birthdate: new Birthdate('2010-01-01'),
      relationship: DependantRelationship.SON,
      sex: Sex.MALE,
      email: new Email('john.jr@example.com'),
      phone: '11999998888',
    });
  };

  it('Deve criar uma nova Família', function () {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    expect(family.holderId).toBe(props.holderId);
    expect(family.id).toBe(props.id);
  });

  it('Deve adicionar um dependente à família', () => {
    const family = new Family({ holderId: '1', id: '1' });
    const dependant = createValidDependant('dep-1', 'Filho');
    family.addDependant(dependant);
    expect(family.dependants).toHaveLength(1);
    expect(family.dependants[0].id).toBe('dep-1');
  });

  it('Não deve adicionar o mesmo dependente duas vezes', () => {
    const family = new Family({ holderId: '1', id: '1' });
    const dependant = createValidDependant('dep-1', 'Filho');
    family.addDependant(dependant);
    expect(() => family.addDependant(dependant)).toThrow(
      new DomainException('Dependant is already a member of this family.'),
    );
  });

  it('Deve remover um dependente da família', () => {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    const dependant = createValidDependant('dep-1', 'Filho');
    family.addDependant(dependant);

    expect(family.dependants).toHaveLength(1);

    family.removeDependant('dep-1');

    expect(family.dependants).toHaveLength(0);
  });

  it('Deve criar família com status de não afiliado', function () {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    expect(family.status).toBe(FamilyStatus.NOT_AFFILIATED);
  });

  it('Deve alterar o status para afiliado', function () {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    expect(family.status).toBe(FamilyStatus.NOT_AFFILIATED);
    family.activateAffiliation();
    expect(family.status).toBe(FamilyStatus.AFFILIATED);
  });
});
