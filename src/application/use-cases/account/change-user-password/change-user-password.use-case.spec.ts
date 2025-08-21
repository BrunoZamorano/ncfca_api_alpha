import ChangeUserPassword from './change-user-password';
import { Test, TestingModule } from '@nestjs/testing';
import HashingService from '@/domain/services/hashing-service';
import { UnitOfWork } from '@/domain/services/unit-of-work';
import UserRepository from '@/domain/repositories/user-repository';
import User from '@/domain/entities/user/user';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { HASHING_SERVICE } from '@/shared/constants/service-constants';
import { UNIT_OF_WORK } from '@/domain/services/unit-of-work';

describe('UNIT ChangeUserPassword', () => {
  let changeUserPassword: ChangeUserPassword;
  let hashingService: jest.Mocked<HashingService>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUserId = 'user-id-123';
  const mockInput = {
    id: mockUserId,
    password: 'OldPassword@123',
    newPassword: 'NewPassword@456',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      find: jest.fn(),
      save: jest.fn(),
    };

    const mockUnitOfWork = {
      userRepository: mockUserRepository,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeUserPassword,
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

    changeUserPassword = module.get<ChangeUserPassword>(ChangeUserPassword);
    hashingService = module.get(HASHING_SERVICE);
    unitOfWork = module.get(UNIT_OF_WORK);
    userRepository = unitOfWork.userRepository as jest.Mocked<UserRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Deve alterar senha quando dados estiverem corretos', async () => {
    // Arrange
    const mockUser = {
      id: mockUserId,
      changePassword: jest.fn(),
    } as unknown as User;

    userRepository.find.mockResolvedValue(mockUser);
    userRepository.save.mockResolvedValue(mockUser);

    // Act
    await changeUserPassword.execute(mockInput);

    // Assert
    expect(userRepository.find).toHaveBeenCalledWith(mockUserId);
    expect(mockUser.changePassword).toHaveBeenCalledWith(mockInput.password, mockInput.newPassword, hashingService);
    expect(userRepository.save).toHaveBeenCalledWith(mockUser);
  });

  it('Deve lançar exceção quando usuário não for encontrado', async () => {
    // Arrange
    userRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(changeUserPassword.execute(mockInput)).rejects.toThrow(EntityNotFoundException);
    await expect(changeUserPassword.execute(mockInput)).rejects.toThrow(`User with id ${mockUserId} not found`);
    expect(userRepository.find).toHaveBeenCalledWith(mockUserId);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('Deve lançar exceção quando senha atual estiver incorreta', async () => {
    // Arrange
    const mockUser = {
      id: mockUserId,
      changePassword: jest.fn().mockImplementation(() => {
        throw new Error('Invalid password');
      }),
    } as unknown as User;

    userRepository.find.mockResolvedValue(mockUser);

    // Act & Assert
    await expect(changeUserPassword.execute(mockInput)).rejects.toThrow('Invalid password');
    expect(userRepository.find).toHaveBeenCalledWith(mockUserId);
    expect(mockUser.changePassword).toHaveBeenCalledWith(mockInput.password, mockInput.newPassword, hashingService);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('Deve lançar exceção quando nova senha for igual à atual', async () => {
    // Arrange
    const samePasswordInput = {
      id: mockUserId,
      password: 'SamePassword@123',
      newPassword: 'SamePassword@123',
    };

    const mockUser = {
      id: mockUserId,
      changePassword: jest.fn().mockImplementation(() => {
        throw new Error(ChangeUserPassword.errorCodes.SAME_PASSWORD);
      }),
    } as unknown as User;

    userRepository.find.mockResolvedValue(mockUser);

    // Act & Assert
    await expect(changeUserPassword.execute(samePasswordInput)).rejects.toThrow(ChangeUserPassword.errorCodes.SAME_PASSWORD);
    expect(userRepository.find).toHaveBeenCalledWith(mockUserId);
    expect(mockUser.changePassword).toHaveBeenCalledWith(samePasswordInput.password, samePasswordInput.newPassword, hashingService);
    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
