import Family from './family';
import { FamilyStatus } from '@/domain/enums/family-status';
import Dependant from '@/domain/entities/dependant/dependant';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import { DomainException, EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';

describe('Família', function () {
  const createValidDependant = (id: string) =>
    new Dependant({
      id,
      firstName: 'John',
      lastName: 'Doe',
      birthdate: new Birthdate('2010-01-01'),
      relationship: DependantRelationship.SON,
      sex: Sex.MALE,
    });

  it('Deve atualizar os dados de um dependente existente', () => {
    const dependant = createValidDependant('dep-1');
    const family = new Family({ id: '1', holderId: '1', dependants: [dependant] });
    const updatePayload = { firstName: 'Jonathan' };

    family.updateDependantInfo('dep-1', updatePayload);

    expect(family.dependants[0].firstName).toBe('Jonathan');
  });

  it('Deve lançar EntityNotFoundException se o dependente não pertencer à família', () => {
    const family = new Family({ id: '1', holderId: '1' });

    expect(() => {
      family.updateDependantInfo('non-existent-id', { firstName: 'test' });
    }).toThrow(new EntityNotFoundException('Dependant', 'non-existent-id'));
  });

  it('Deve criar uma nova Família', function () {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    expect(family.holderId).toBe(props.holderId);
    expect(family.id).toBe(props.id);
  });

  it('Deve adicionar um dependente à família', () => {
    const family = new Family({ holderId: '1', id: '1' });
    const dependant = createValidDependant('dep-1');
    family.addDependant(dependant);
    expect(family.dependants).toHaveLength(1);
    expect(family.dependants[0].id).toBe('dep-1');
  });

  it('Não deve adicionar o mesmo dependente duas vezes', () => {
    const family = new Family({ holderId: '1', id: '1' });
    const dependant = createValidDependant('dep-1');
    family.addDependant(dependant);
    expect(() => family.addDependant(dependant)).toThrow(
      new DomainException('Dependant is already a member of this family.'),
    );
  });

  it('Deve remover um dependente da família', () => {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    const dependant = createValidDependant('dep-1');
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
