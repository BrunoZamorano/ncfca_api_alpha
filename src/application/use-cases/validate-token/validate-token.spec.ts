import TokenService, { DecodedToken } from '@/application/services/token-service';
import ValidateToken from '@/application/use-cases/validate-token/validate-token';

import AnemicTokenService from '@/infraestructure/services/anemic-token-service';

describe('ValidateToken', function () {
  let validateToken: ValidateToken;
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new AnemicTokenService();
    validateToken = new ValidateToken(tokenService);
  });

  it('Deve validar um token válido', async function () {
    const input = AnemicTokenService.ACCESS_TOKEN;
    const output: DecodedToken = await validateToken.execute(input);
    const decoded = AnemicTokenService.stubDecodedToken;
    expect(output.familyId).toBe(decoded.familyId);
    expect(output.email).toBe(decoded.email);
    expect(output.roles).toBe(decoded.roles);
    expect(output.sub).toBe(decoded.sub);
    expect(output.iat).toBeDefined();
    expect(output.exp).toBeDefined();
  });
});
