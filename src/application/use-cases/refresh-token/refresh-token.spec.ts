import RefreshToken from '@/application/use-cases/refresh-token/refresh-token';
import TokenService from '@/application/services/token-service';

import AnemicTokenService from '@/infraestructure/services/anemic-token-service';

describe('Renovar o token', function () {
  let tokenService: TokenService;
  let refreshToken: RefreshToken;
  let dependencies: [TokenService];

  beforeEach(() => {
    tokenService = new AnemicTokenService();
    dependencies = [tokenService];
    refreshToken = new RefreshToken(...dependencies);
  });

  it('Deve renovar o token se for válido', async function () {
    const output = await refreshToken.execute(AnemicTokenService.REFRESH_TOKEN);
    expect(output.accessToken).toBe(AnemicTokenService.ACCESS_TOKEN);
    expect(output.refreshToken).toBe(AnemicTokenService.REFRESH_TOKEN);
  });
});
