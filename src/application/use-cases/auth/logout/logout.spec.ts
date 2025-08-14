import Logout from '@/application/use-cases/logout/logout';

describe('Logout', function () {
  it('Deve retornar nada pois o logout stateless e gerenciado pelo cliente', async function () {
    const logout = new Logout();
    expect(await logout.execute()).toBe(void 0);
  });
});
