import { Test } from '@nestjs/testing';
import { UnitOfWork, UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import User from '@/domain/entities/user/user';
import AdminGetUser from './get-user';

describe('AdminGetUser', () => {
  let useCase: AdminGetUser;
  let unitOfWork: UnitOfWork;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '1234567890',
    cpf: '12345678901',
    rg: '123456',
  } as User;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminGetUser,
        {
          provide: UNIT_OF_WORK,
          useValue: {
            userRepository: {
              find: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get<AdminGetUser>(AdminGetUser);
    unitOfWork = moduleRef.get<UnitOfWork>(UNIT_OF_WORK);
  });

  it('Deve retornar um usuário existente', async () => {
    const userId = 'user-123';
    jest.spyOn(unitOfWork.userRepository, 'find').mockResolvedValue(mockUser);

    const result = await useCase.execute(userId);

    expect(unitOfWork.userRepository.find).toHaveBeenCalledWith(userId);
    expect(result).toBe(mockUser);
  });

  it('Deve lançar EntityNotFoundException quando usuário não é encontrado', async () => {
    const userId = 'nonexistent-user';
    jest.spyOn(unitOfWork.userRepository, 'find').mockResolvedValue(null);

    await expect(useCase.execute(userId)).rejects.toThrow(
      new EntityNotFoundException('User', userId)
    );

    expect(unitOfWork.userRepository.find).toHaveBeenCalledWith(userId);
  });
});