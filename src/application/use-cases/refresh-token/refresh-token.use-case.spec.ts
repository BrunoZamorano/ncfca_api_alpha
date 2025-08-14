import { Test, TestingModule } from '@nestjs/testing';
import RefreshToken from './refresh-token';
import TokenService, { DecodedToken } from '@/application/services/token-service';
import { TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { UnauthorizedException } from '@nestjs/common';
import { UserRoles } from '@/domain/enums/user-roles';

describe('UNIT RefreshToken', () => {
  let refreshTokenUseCase: RefreshToken;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshToken,
        {
          provide: TOKEN_SERVICE,
          useValue: {
            verifyRefreshToken: jest.fn(),
            signAccessToken: jest.fn(),
            signRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    refreshTokenUseCase = module.get<RefreshToken>(RefreshToken);
    tokenService = module.get<TokenService>(TOKEN_SERVICE);
  });

  it('Deve retornar um novo par de tokens para um refresh token válido', async () => {
    // Arrange
    const validRefreshToken = 'valid-refresh-token';
    const decodedToken: DecodedToken = {
      sub: 'user-id',
      email: 'test@example.com',
      roles: [UserRoles.SEM_FUNCAO],
      familyId: 'family-id',
      iat: Date.now(),
      exp: Date.now() + 10000,
    };

    jest.spyOn(tokenService, 'verifyRefreshToken').mockResolvedValue(decodedToken);
    jest.spyOn(tokenService, 'signAccessToken').mockResolvedValue('new-access-token');
    jest.spyOn(tokenService, 'signRefreshToken').mockResolvedValue('new-refresh-token');

    // Act
    const result = await refreshTokenUseCase.execute(validRefreshToken);

    // Assert
    expect(result).toEqual({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });
    expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(validRefreshToken);
    expect(tokenService.signAccessToken).toHaveBeenCalledWith({ sub: decodedToken.sub, email: decodedToken.email, roles: decodedToken.roles, familyId: decodedToken.familyId });
    expect(tokenService.signRefreshToken).toHaveBeenCalledWith({ sub: decodedToken.sub, email: decodedToken.email, roles: decodedToken.roles, familyId: decodedToken.familyId });
  });

  it('Deve lançar uma exceção para um refresh token inválido', async () => {
    // Arrange
    const invalidRefreshToken = 'invalid-refresh-token';
    jest.spyOn(tokenService, 'verifyRefreshToken').mockResolvedValue(null as any); // Simulate invalid token

    // Act & Assert
    await expect(refreshTokenUseCase.execute(invalidRefreshToken)).rejects.toThrow(
      new UnauthorizedException(RefreshToken.errorCodes.INVALID_TOKEN),
    );
  });
});
