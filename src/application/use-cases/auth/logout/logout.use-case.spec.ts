import Logout from './logout';

describe('UNIT Logout', () => {
  it('Deve executar sem lançar erros', async () => {
    // Arrange
    const logoutUseCase = new Logout();

    // Act & Assert
    await expect(logoutUseCase.execute()).resolves.toBeUndefined();
  });
});
