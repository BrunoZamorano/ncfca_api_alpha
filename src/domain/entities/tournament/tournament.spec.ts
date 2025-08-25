import Tournament from './tournament.entity';
import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import IdGenerator from '@/application/services/id-generator';
import { TournamentType } from '@/domain/enums/tournament-type.enum';

const mockIdGenerator: IdGenerator = {
  generate: jest.fn().mockImplementation(() => `mock-uuid-${Math.random()}`),
};

describe('(UNIT) Tournament Entity', () => {
  const validTournamentProps = {
    name: 'Torneio Nacional de Debate',
    description: 'Torneio nacional de debate para estudantes do ensino médio com foco em argumentação',
    type: TournamentType.INDIVIDUAL,
    registrationStartDate: new Date('2024-01-01'),
    registrationEndDate: new Date('2024-01-15'),
    startDate: new Date('2024-02-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Creation', () => {
    it('Deve criar um torneio com dados válidos', () => {
      // Arrange
      const props = { ...validTournamentProps };

      // Act
      const tournament = Tournament.create(props, mockIdGenerator);

      // Assert
      expect(tournament).toBeInstanceOf(Tournament);
      expect(tournament.name).toBe(props.name);
      expect(tournament.description).toBe(props.description);
      expect(tournament.type).toBe(props.type);
      expect(tournament.registrationStartDate).toEqual(props.registrationStartDate);
      expect(tournament.registrationEndDate).toEqual(props.registrationEndDate);
      expect(tournament.startDate).toEqual(props.startDate);
      expect(tournament.deletedAt).toBeNull();
      expect(tournament.registrationCount).toBe(0);
      expect(tournament.isDeleted()).toBe(false);
      expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
    });

    it('Não deve permitir criar torneio com nome muito curto', () => {
      // Arrange
      const props = { ...validTournamentProps, name: 'AB' };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament name is required and must have at least 3 characters.'),
      );
    });

    it('Não deve permitir criar torneio com nome vazio', () => {
      // Arrange
      const props = { ...validTournamentProps, name: '' };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament name is required and must have at least 3 characters.'),
      );
    });

    it('Não deve permitir criar torneio com descrição muito curta', () => {
      // Arrange
      const props = { ...validTournamentProps, description: 'Desc' };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament description is required and must have at least 10 characters.'),
      );
    });

    it('Não deve permitir criar torneio com descrição vazia', () => {
      // Arrange
      const props = { ...validTournamentProps, description: '' };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament description is required and must have at least 10 characters.'),
      );
    });

    it('Não deve permitir que a data final de inscrição seja anterior à data inicial', () => {
      // Arrange
      const props = {
        ...validTournamentProps,
        registrationStartDate: new Date('2024-01-15'),
        registrationEndDate: new Date('2024-01-10'),
      };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Registration end date cannot be before or equal to the start date.'),
      );
    });

    it('Não deve permitir que a data final de inscrição seja igual à data inicial', () => {
      // Arrange
      const sameDate = new Date('2024-01-15');
      const props = {
        ...validTournamentProps,
        registrationStartDate: sameDate,
        registrationEndDate: sameDate,
      };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Registration end date cannot be before or equal to the start date.'),
      );
    });

    it('Não deve permitir que a data de início do torneio seja antes do fim das inscrições', () => {
      // Arrange
      const props = {
        ...validTournamentProps,
        registrationEndDate: new Date('2024-01-20'),
        startDate: new Date('2024-01-15'),
      };

      // Act & Assert
      expect(() => Tournament.create(props, mockIdGenerator)).toThrow(
        new InvalidOperationException('Tournament start date cannot be before registration end date.'),
      );
    });
  });

  describe('Update', () => {
    it('Deve atualizar propriedades do torneio corretamente', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);
      const updateProps = {
        name: 'Torneio Atualizado',
        description: 'Nova descrição do torneio com mais detalhes',
        type: TournamentType.DUO,
      };

      // Act
      tournament.update(updateProps);

      // Assert
      expect(tournament.name).toBe(updateProps.name);
      expect(tournament.description).toBe(updateProps.description);
      expect(tournament.type).toBe(updateProps.type);
    });

    it('Deve atualizar apenas as propriedades fornecidas', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);
      const originalName = tournament.name;
      const newDescription = 'Nova descrição atualizada com informações completas';

      // Act
      tournament.update({ description: newDescription });

      // Assert
      expect(tournament.name).toBe(originalName);
      expect(tournament.description).toBe(newDescription);
    });

    it('Não deve permitir a atualização de um torneio que já possui inscrições', () => {
      // Arrange
      const tournament = new Tournament({
        id: 'test-id',
        name: validTournamentProps.name,
        description: validTournamentProps.description,
        type: validTournamentProps.type,
        registrationStartDate: validTournamentProps.registrationStartDate,
        registrationEndDate: validTournamentProps.registrationEndDate,
        startDate: validTournamentProps.startDate,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationCount: 5,
      });

      // Act & Assert
      expect(() => tournament.update({ name: 'Novo Nome' })).toThrow(
        new InvalidOperationException('Cannot update a tournament that already has registrations.'),
      );
    });

    it('Não deve permitir a atualização de um torneio deletado', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);
      tournament.softDelete();

      // Act & Assert
      expect(() => tournament.update({ name: 'Novo Nome' })).toThrow(new InvalidOperationException('Cannot update a deleted tournament.'));
    });

    it('Não deve permitir atualizar com nome inválido', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act & Assert
      expect(() => tournament.update({ name: 'AB' })).toThrow(new InvalidOperationException('Tournament name must have at least 3 characters.'));
    });

    it('Não deve permitir atualizar com descrição inválida', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act & Assert
      expect(() => tournament.update({ description: 'Desc' })).toThrow(
        new InvalidOperationException('Tournament description must have at least 10 characters.'),
      );
    });

    it('Deve validar datas após atualização', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act & Assert
      expect(() =>
        tournament.update({
          registrationStartDate: new Date('2024-01-20'),
          registrationEndDate: new Date('2024-01-15'),
        }),
      ).toThrow(new InvalidOperationException('Registration end date cannot be before or equal to the start date.'));
    });

    it('Deve validar data de início após atualização', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act & Assert
      expect(() =>
        tournament.update({
          registrationEndDate: new Date('2024-01-25'),
          startDate: new Date('2024-01-20'),
        }),
      ).toThrow(new InvalidOperationException('Tournament start date cannot be before registration end date.'));
    });
  });

  describe('Soft Delete', () => {
    it('Deve deletar um torneio corretamente', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Act
      tournament.softDelete();

      // Assert
      expect(tournament.deletedAt).toBeInstanceOf(Date);
      expect(tournament.isDeleted()).toBe(true);
    });

    it('Não deve permitir deletar um torneio que já possui inscrições', () => {
      // Arrange
      const tournament = new Tournament({
        id: 'test-id',
        name: validTournamentProps.name,
        description: validTournamentProps.description,
        type: validTournamentProps.type,
        registrationStartDate: validTournamentProps.registrationStartDate,
        registrationEndDate: validTournamentProps.registrationEndDate,
        startDate: validTournamentProps.startDate,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationCount: 3,
      });

      // Act & Assert
      expect(() => tournament.softDelete()).toThrow(new InvalidOperationException('Cannot delete a tournament that already has registrations.'));
    });

    it('Não deve permitir deletar um torneio já deletado', () => {
      // Arrange
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);
      tournament.softDelete();

      // Act & Assert
      expect(() => tournament.softDelete()).toThrow(new InvalidOperationException('Tournament is already deleted.'));
    });
  });

  describe('Getters', () => {
    it('Deve retornar todas as propriedades corretamente', () => {
      // Arrange & Act
      const tournament = Tournament.create(validTournamentProps, mockIdGenerator);

      // Assert
      expect(tournament.id).toBeDefined();
      expect(tournament.name).toBe(validTournamentProps.name);
      expect(tournament.description).toBe(validTournamentProps.description);
      expect(tournament.type).toBe(validTournamentProps.type);
      expect(tournament.registrationStartDate).toEqual(validTournamentProps.registrationStartDate);
      expect(tournament.registrationEndDate).toEqual(validTournamentProps.registrationEndDate);
      expect(tournament.startDate).toEqual(validTournamentProps.startDate);
      expect(tournament.deletedAt).toBeNull();
      expect(tournament.createdAt).toBeInstanceOf(Date);
      expect(tournament.updatedAt).toBeInstanceOf(Date);
      expect(tournament.registrationCount).toBe(0);
    });
  });
});
