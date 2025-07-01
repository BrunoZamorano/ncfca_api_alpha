import Family from './family';

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
});
