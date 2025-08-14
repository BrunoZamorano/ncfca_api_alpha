import { Test, TestingModule } from '@nestjs/testing';
import ValidateToken from './validate-token';
import TokenService, { DecodedToken } from '@/application/services/token-service';
import { TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { UnauthorizedException } from '@nestjs/common';
import { UserRoles } from '@/domain/enums/user-roles';

describe('UNIT ValidateToken', () => {
  let validateTokenUseCase: ValidateToken;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateToken,
        {
          provide: TOKEN_SERVICE,
          useValue: {
            verifyAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    validateTokenUseCase = module.get<ValidateToken>(ValidateToken);
    tokenService = module.get<TokenService>(TOKEN_SERVICE);
  });

  it('Deve retornar o payload para um token válido', async () => {
    // Arrange
    const validAccessToken = 'valid-access-token';
    const decodedToken: DecodedToken = {
      sub: 'user-id',
      email: 'test@example.com',
      roles: [UserRoles.SEM_FUNCAO],
      familyId: 'family-id',
      iat: Date.now(),
      exp: Date.now() + 10000,
    };

    jest.spyOn(tokenService, 'verifyAccessToken').mockResolvedValue(decodedToken);

    // Act
    const result = await validateTokenUseCase.execute(validAccessToken);

    // Assert
    expect(result).toEqual(decodedToken);
    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith(validAccessToken);
  });

  it('Deve lançar uma exceção para um token inválido', async () => {
    // Arrange
    const invalidAccessToken = 'invalid-access-token';
    const error = new UnauthorizedException('Invalid token');
    jest.spyOn(tokenService, 'verifyAccessToken').mockRejectedValue(error);

    // Act & Assert
    await expect(validateTokenUseCase.execute(invalidAccessToken)).rejects.toThrow(error);
  });
});
