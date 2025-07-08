import Family from './family';
import { FamilyStatus } from '@/domain/enums/family-status';

describe('Família', function () {
  it('Deve criar uma nova Família', function () {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    expect(family.holderId).toBe(props.holderId);
    expect(family.id).toBe(props.id);
  });

  it('Deve adicionar dependentes à família', function () {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    family.addDependant('2');
    expect(family.dependants).toContain('2');
  });

  it('Não deve adicionar o mesmo dependente à família', function () {
    const props = { holderId: '1', id: '1' };
    const family = new Family(props);
    family.addDependant('2');
    expect(() => family.addDependant('2')).toThrow(Family.errorCodes.ALREADY_MEMBER);
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
