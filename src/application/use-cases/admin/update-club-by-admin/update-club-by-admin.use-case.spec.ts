import { Test } from '@nestjs/testing';
import { UnitOfWork, UNIT_OF_WORK } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import Club from '@/domain/entities/club/club';
import Address from '@/domain/value-objects/address/address';
import UpdateClubByAdmin from './update-club-by-admin.use-case';
import { UpdateClubByAdminInput } from './update-club-by-admin.input';

describe('UpdateClubByAdmin', () => {
  let useCase: UpdateClubByAdmin;
  let unitOfWork: UnitOfWork;

  const mockAddress = new Address({
    zipCode: '12345678',
    street: 'Rua Teste',
    number: '123',
    district: 'Centro',
    city: 'Cidade Teste',
    state: 'SP',
    complement: 'Apto 1'
  });

  const mockClub = {
    id: 'club-123',
    name: 'Clube Original',
    maxMembers: 20,
    address: mockAddress,
    updateInfo: jest.fn(),
  } as unknown as Club;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdateClubByAdmin,
        {
          provide: UNIT_OF_WORK,
          useValue: {
            executeInTransaction: jest.fn((callback) => callback()),
            clubRepository: {
              find: jest.fn(),
              save: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get<UpdateClubByAdmin>(UpdateClubByAdmin);
    unitOfWork = moduleRef.get<UnitOfWork>(UNIT_OF_WORK);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Deve atualizar um clube existente com sucesso', async () => {
    const input: UpdateClubByAdminInput = {
      clubId: 'club-123',
      data: {
        name: 'Clube Atualizado',
        maxMembers: 30,
      },
    };

    jest.spyOn(unitOfWork.clubRepository, 'find').mockResolvedValue(mockClub);
    jest.spyOn(unitOfWork.clubRepository, 'save').mockResolvedValue(mockClub);

    await useCase.execute(input);

    expect(unitOfWork.clubRepository.find).toHaveBeenCalledWith('club-123');
    expect(mockClub.updateInfo).toHaveBeenCalledWith({
      name: 'Clube Atualizado',
      maxMembers: 30,
      address: undefined,
    });
    expect(unitOfWork.clubRepository.save).toHaveBeenCalledWith(mockClub);
  });

  it('Deve atualizar um clube com novo endereço', async () => {
    const input: UpdateClubByAdminInput = {
      clubId: 'club-123',
      data: {
        name: 'Clube com Novo Endereço',
        address: {
          zipCode: '87654321',
          street: 'Avenida Nova',
          number: '456',
          district: 'Bairro Novo',
          city: 'Nova Cidade',
          state: 'RJ',
        },
      },
    };

    jest.spyOn(unitOfWork.clubRepository, 'find').mockResolvedValue(mockClub);
    jest.spyOn(unitOfWork.clubRepository, 'save').mockResolvedValue(mockClub);

    await useCase.execute(input);

    expect(unitOfWork.clubRepository.find).toHaveBeenCalledWith('club-123');
    expect(mockClub.updateInfo).toHaveBeenCalledWith({
      name: 'Clube com Novo Endereço',
      address: expect.any(Address),
    });
    expect(unitOfWork.clubRepository.save).toHaveBeenCalledWith(mockClub);
  });

  it('Deve lançar EntityNotFoundException quando clube não é encontrado', async () => {
    const input: UpdateClubByAdminInput = {
      clubId: 'nonexistent-club',
      data: {
        name: 'Clube Inexistente',
      },
    };

    jest.spyOn(unitOfWork.clubRepository, 'find').mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      new EntityNotFoundException('Club', 'for clubId: nonexistent-club')
    );

    expect(unitOfWork.clubRepository.find).toHaveBeenCalledWith('nonexistent-club');
    expect(unitOfWork.clubRepository.save).not.toHaveBeenCalled();
  });

  it('Deve executar dentro de uma transação', async () => {
    const input: UpdateClubByAdminInput = {
      clubId: 'club-123',
      data: {
        name: 'Clube em Transação',
      },
    };

    jest.spyOn(unitOfWork.clubRepository, 'find').mockResolvedValue(mockClub);
    jest.spyOn(unitOfWork.clubRepository, 'save').mockResolvedValue(mockClub);

    await useCase.execute(input);

    expect(unitOfWork.executeInTransaction).toHaveBeenCalled();
  });
});
