import Logout from './logout.use-case';

describe('UNIT Logout', () => {
  it('Deve executar sem lançar erros', async () => {
    // Arrange
    const logoutUseCase = new Logout();

    // Act & Assert
    await expect(logoutUseCase.execute()).resolves.toBeUndefined();
  });
});
