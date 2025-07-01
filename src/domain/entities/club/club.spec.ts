import Club from './club';

describe('Clube', function () {
  it('Deve criar um novo Clube', function () {
    const props = {
      ownerId: '1',
      id: '1',
    };
    const club = new Club(props);
    expect(club.affiliatedFamilies).toContain(props.ownerId);
    expect(club.ownerId).toBe(props.ownerId);
    expect(club.id).toBe(props.id);
  });

  it('Deve adicionar familias afiliadas ao clube', function () {
    const props = {
      ownerId: '1',
      id: '1',
    };
    const club = new Club(props);
    club.addAffiliatedFamily('2');
    expect(club.affiliatedFamilies).toContain('2');
  });

  it('Não deve adicionar a mesma família ao clube', function () {
    const props = {
      ownerId: '1',
      id: '1',
    };
    const club = new Club(props);
    club.addAffiliatedFamily('2');
    expect(() => club.addAffiliatedFamily('2')).toThrow(Club.errorCodes.ALREADY_AFFILIATED);
  });
});
