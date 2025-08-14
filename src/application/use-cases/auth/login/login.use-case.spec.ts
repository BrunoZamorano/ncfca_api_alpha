import { Test, TestingModule } from '@nestjs/testing';
import Login from './login';
import TokenService from '@/application/services/token-service';
import UserRepository from '@/domain/repositories/user-repository';
import User from '@/domain/entities/user/user';
import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import Password from '@/domain/value-objects/password/password';
import HashingService from '@/domain/services/hashing-service';
import Email from '@/domain/value-objects/email/email';
import Cpf from '@/domain/value-objects/cpf/cpf';
import Address from '@/domain/value-objects/address/address';
import { UserRoles } from '@/domain/enums/user-roles';
import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import FamilyRepository from '@/domain/repositories/family-repository';
import { FamilyStatus } from '@/domain/enums/family-status';
import Family from '@/domain/entities/family/family';
import { UnauthorizedException } from '@nestjs/common';

const mockHashingService: HashingService = {
  hash: jest.fn((value) => `hashed_${value}`),
  compare: jest.fn((plain, hashed) => hashed === `hashed_${plain}`),
};

describe('UNIT Login', () => {
  let loginUseCase: Login;
  let userRepository: UserRepository;
  let familyRepository: FamilyRepository;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Login,
        {
          provide: USER_REPOSITORY,
          useValue: { findByEmail: jest.fn() },
        },
        {
          provide: FAMILY_REPOSITORY,
          useValue: { findByHolderId: jest.fn() },
        },
        {
          provide: HASHING_SERVICE,
          useValue: mockHashingService,
        },
        {
          provide: TOKEN_SERVICE,
          useValue: {
            signAccessToken: jest.fn(),
            signRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    loginUseCase = module.get<Login>(Login);
    userRepository = module.get<UserRepository>(USER_REPOSITORY);
    familyRepository = module.get<FamilyRepository>(FAMILY_REPOSITORY);
    tokenService = module.get<TokenService>(TOKEN_SERVICE);
  });

  it('Deve retornar tokens quando as credenciais estiverem corretas', async () => {
    // Arrange
    const plainPassword = 'validPassword123';
    const userEmail = 'test@example.com';

    const user = new User({
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: new Email(userEmail),
      password: Password.create(plainPassword, mockHashingService),
      phone: '123456789',
      cpf: new Cpf(Cpf.VALID_CPF),
      rg: '12345678',
      roles: [UserRoles.SEM_FUNCAO],
      address: new Address({}),
    });

    const family = new Family({ id: 'family-1', holderId: user.id, status: FamilyStatus.AFFILIATED });

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(user);
    jest.spyOn(familyRepository, 'findByHolderId').mockResolvedValue(family);
    jest.spyOn(tokenService, 'signAccessToken').mockResolvedValue('access-token');
    jest.spyOn(tokenService, 'signRefreshToken').mockResolvedValue('refresh-token');

    // Act
    const result = await loginUseCase.execute({ email: userEmail, password: plainPassword });

    // Assert
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(userRepository.findByEmail).toHaveBeenCalledWith(userEmail);
    expect(familyRepository.findByHolderId).toHaveBeenCalledWith(user.id);
    expect(tokenService.signAccessToken).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      familyId: family.id,
    });
  });

  it('Deve lançar uma exceção quando o usuário não for encontrado', async () => {
    // Arrange
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

    // Act & Assert
    await expect(loginUseCase.execute({ email: 'nonexistent@example.com', password: 'password' })).rejects.toThrow(
      new UnauthorizedException(Login.errorCodes.INVALID_CREDENTIALS),
    );
  });

  it('Deve lançar uma exceção quando a senha estiver incorreta', async () => {
    // Arrange
    const plainPassword = 'validPassword123';
    const wrongPassword = 'wrongPassword';
    const userEmail = 'test@example.com';

    const user = new User({
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: new Email(userEmail),
      password: Password.create(plainPassword, mockHashingService),
      phone: '123456789',
      cpf: new Cpf(Cpf.VALID_CPF),
      rg: '12345678',
      roles: [UserRoles.SEM_FUNCAO],
      address: new Address({}),
    });

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(user);

    // Act & Assert
    await expect(loginUseCase.execute({ email: userEmail, password: wrongPassword })).rejects.toThrow(
      new UnauthorizedException(Login.errorCodes.INVALID_CREDENTIALS),
    );
  });

  it('Deve lançar uma exceção se a família não for encontrada', async () => {
    // Arrange
    const plainPassword = 'validPassword123';
    const userEmail = 'test@example.com';

    const user = new User({
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: new Email(userEmail),
      password: Password.create(plainPassword, mockHashingService),
      phone: '123456789',
      cpf: new Cpf(Cpf.VALID_CPF),
      rg: '12345678',
      roles: [UserRoles.SEM_FUNCAO],
      address: new Address({}),
    });

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(user);
    jest.spyOn(familyRepository, 'findByHolderId').mockResolvedValue(null);

    // Act & Assert
    await expect(loginUseCase.execute({ email: userEmail, password: plainPassword })).rejects.toThrow(
      new InvalidOperationException(Login.errorCodes.FAMILY_NOT_FOUND),
    );
  });
});
