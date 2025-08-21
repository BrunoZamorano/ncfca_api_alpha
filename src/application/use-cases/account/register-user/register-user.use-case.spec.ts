import RegisterUser from './register-user';
import { Test, TestingModule } from '@nestjs/testing';
import TokenService from '@/application/services/token-service';
import IdGenerator from '@/application/services/id-generator';
import HashingService from '@/domain/services/hashing-service';
import { UnitOfWork } from '@/domain/services/unit-of-work';
import UserRepository from '@/domain/repositories/user-repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import User from '@/domain/entities/user/user';
import Family from '@/domain/entities/family/family';
import { FamilyStatus } from '@/domain/enums/family-status';
import { UserRoles } from '@/domain/enums/user-roles';
import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { HASHING_SERVICE, ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import Cpf from '@/domain/value-objects/cpf/cpf';

describe('UNIT RegisterUser', () => {
  let registerUser: RegisterUser;
  let tokenService: jest.Mocked<TokenService>;
  let idGenerator: jest.Mocked<IdGenerator>;
  let hashingService: jest.Mocked<HashingService>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let userRepository: jest.Mocked<UserRepository>;
  let familyRepository: jest.Mocked<FamilyRepository>;

  const mockInput = {
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@example.com',
    phone: '11987654321',
    cpf: Cpf.VALID_CPF,
    password: 'Password@123',
  };

  const mockUserId = 'user-id-123';
  const mockFamilyId = 'family-id-456';
  const mockAccessToken = 'access-token-abc';
  const mockRefreshToken = 'refresh-token-xyz';

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      save: jest.fn(),
    };

    const mockFamilyRepository = {
      save: jest.fn(),
    };

    const mockUnitOfWork = {
      executeInTransaction: jest.fn(),
      userRepository: mockUserRepository,
      familyRepository: mockFamilyRepository,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUser,
        {
          provide: TOKEN_SERVICE,
          useValue: {
            signAccessToken: jest.fn(),
            signRefreshToken: jest.fn(),
          },
        },
        {
          provide: ID_GENERATOR,
          useValue: {
            generate: jest.fn(),
          },
        },
        {
          provide: HASHING_SERVICE,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
        {
          provide: UNIT_OF_WORK,
          useValue: mockUnitOfWork,
        },
      ],
    }).compile();

    registerUser = module.get<RegisterUser>(RegisterUser);
    tokenService = module.get(TOKEN_SERVICE);
    idGenerator = module.get(ID_GENERATOR);
    hashingService = module.get(HASHING_SERVICE);
    unitOfWork = module.get(UNIT_OF_WORK);
    userRepository = unitOfWork.userRepository as jest.Mocked<UserRepository>;
    familyRepository = unitOfWork.familyRepository as jest.Mocked<FamilyRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Deve registrar usuário com dados válidos e retornar tokens', async () => {
    // Arrange
    const mockUser = {
      id: mockUserId,
      email: mockInput.email,
      roles: [UserRoles.SEM_FUNCAO],
    } as User;

    const mockFamily = {
      id: mockFamilyId,
      holderId: mockUserId,
      status: FamilyStatus.NOT_AFFILIATED,
    } as Family;

    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.findByCpf.mockResolvedValue(null);
    userRepository.save.mockResolvedValue(mockUser);
    familyRepository.save.mockResolvedValue(mockFamily);
    idGenerator.generate.mockReturnValue(mockFamilyId);
    tokenService.signAccessToken.mockResolvedValue(mockAccessToken);
    tokenService.signRefreshToken.mockResolvedValue(mockRefreshToken);

    unitOfWork.executeInTransaction.mockImplementation(async (callback) => {
      return await callback();
    });

    // Act
    const result = await registerUser.execute(mockInput);

    // Assert
    expect(result).toEqual({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });
    expect(userRepository.findByEmail).toHaveBeenCalledWith(mockInput.email);
    expect(userRepository.findByCpf).toHaveBeenCalledWith(mockInput.cpf);
    expect(userRepository.save).toHaveBeenCalled();
    expect(familyRepository.save).toHaveBeenCalled();
    expect(tokenService.signAccessToken).toHaveBeenCalled();
    expect(tokenService.signRefreshToken).toHaveBeenCalled();
  });

  it('Deve lançar exceção quando email já estiver em uso', async () => {
    // Arrange
    const existingUser = { id: 'existing-user' } as User;
    userRepository.findByEmail.mockResolvedValue(existingUser);

    unitOfWork.executeInTransaction.mockImplementation(async (callback) => {
      return await callback();
    });

    // Act & Assert
    await expect(registerUser.execute(mockInput)).rejects.toThrow(RegisterUser.errorCodes.EMAIL_ALREADY_IN_USE);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(mockInput.email);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('Deve lançar exceção quando CPF já estiver em uso', async () => {
    // Arrange
    const existingUser = { id: 'existing-user' } as User;
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.findByCpf.mockResolvedValue(existingUser);

    unitOfWork.executeInTransaction.mockImplementation(async (callback) => {
      return await callback();
    });

    // Act & Assert
    await expect(registerUser.execute(mockInput)).rejects.toThrow(InvalidOperationException);
    await expect(registerUser.execute(mockInput)).rejects.toThrow('Cpf já cadastrado');
    expect(userRepository.findByEmail).toHaveBeenCalledWith(mockInput.email);
    expect(userRepository.findByCpf).toHaveBeenCalledWith(mockInput.cpf);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('Deve criar família automaticamente para o usuário', async () => {
    // Arrange
    const mockUser = {
      id: mockUserId,
      email: mockInput.email,
      roles: [UserRoles.SEM_FUNCAO],
    } as User;

    const mockFamily = {
      id: mockFamilyId,
      holderId: mockUserId,
      status: FamilyStatus.NOT_AFFILIATED,
    } as Family;

    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.findByCpf.mockResolvedValue(null);
    userRepository.save.mockResolvedValue(mockUser);
    familyRepository.save.mockResolvedValue(mockFamily);
    idGenerator.generate.mockReturnValue(mockFamilyId);
    tokenService.signAccessToken.mockResolvedValue(mockAccessToken);
    tokenService.signRefreshToken.mockResolvedValue(mockRefreshToken);

    unitOfWork.executeInTransaction.mockImplementation(async (callback) => {
      return await callback();
    });

    // Act
    await registerUser.execute(mockInput);

    // Assert
    expect(familyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        holderId: mockUserId,
        status: FamilyStatus.NOT_AFFILIATED,
      }),
    );
    expect(idGenerator.generate).toHaveBeenCalled();
  });
});
