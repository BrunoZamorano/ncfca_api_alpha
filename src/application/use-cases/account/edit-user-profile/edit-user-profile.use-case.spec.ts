import EditUserProfile from './edit-user-profile';
import { Test, TestingModule } from '@nestjs/testing';
import UserRepository from '@/domain/repositories/user-repository';
import User from '@/domain/entities/user/user';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { USER_REPOSITORY } from '@/shared/constants/repository-constants';

describe('UNIT EditUserProfile', () => {
  let editUserProfile: EditUserProfile;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUserId = 'user-id-123';
  const mockInput = {
    id: mockUserId,
    firstName: 'José',
    lastName: 'Santos',
    phone: '11998877665',
    email: 'jose.santos@example.com',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditUserProfile,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    editUserProfile = module.get<EditUserProfile>(EditUserProfile);
    userRepository = module.get(USER_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Deve atualizar perfil do usuário com dados válidos', async () => {
    // Arrange
    const mockUser = {
      id: mockUserId,
      firstName: 'João',
      lastName: 'Silva',
      phone: '11987654321',
      email: 'joao.silva@example.com',
      updateProfile: jest.fn(),
    } as unknown as User;

    const updatedUser = {
      ...mockUser,
      firstName: mockInput.firstName,
      lastName: mockInput.lastName,
      phone: mockInput.phone,
      email: mockInput.email,
    } as User;

    userRepository.find.mockResolvedValue(mockUser);
    userRepository.save.mockResolvedValue(updatedUser);

    // Act
    const result = await editUserProfile.execute(mockInput);

    // Assert
    expect(result).toEqual(updatedUser);
    expect(userRepository.find).toHaveBeenCalledWith(mockUserId);
    expect(mockUser.updateProfile).toHaveBeenCalledWith({
      firstName: mockInput.firstName,
      lastName: mockInput.lastName,
      phone: mockInput.phone,
      email: mockInput.email,
    });
    expect(userRepository.save).toHaveBeenCalledWith(mockUser);
  });

  it('Deve lançar exceção quando usuário não for encontrado', async () => {
    // Arrange
    userRepository.find.mockResolvedValue(null);

    // Act & Assert
    await expect(editUserProfile.execute(mockInput)).rejects.toThrow(EntityNotFoundException);
    await expect(editUserProfile.execute(mockInput)).rejects.toThrow(`User with id ${mockUserId} not found`);
    expect(userRepository.find).toHaveBeenCalledWith(mockUserId);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('Deve permitir atualização parcial dos dados', async () => {
    // Arrange
    const partialInput = {
      id: mockUserId,
      firstName: 'José',
    };

    const mockUser = {
      id: mockUserId,
      firstName: 'João',
      lastName: 'Silva',
      phone: '11987654321',
      email: 'joao.silva@example.com',
      updateProfile: jest.fn(),
    } as unknown as User;

    const updatedUser = {
      ...mockUser,
      firstName: partialInput.firstName,
    } as User;

    userRepository.find.mockResolvedValue(mockUser);
    userRepository.save.mockResolvedValue(updatedUser);

    // Act
    const result = await editUserProfile.execute(partialInput);

    // Assert
    expect(result).toEqual(updatedUser);
    expect(userRepository.find).toHaveBeenCalledWith(mockUserId);
    expect(mockUser.updateProfile).toHaveBeenCalledWith({
      firstName: partialInput.firstName,
    });
    expect(userRepository.save).toHaveBeenCalledWith(mockUser);
  });
});
