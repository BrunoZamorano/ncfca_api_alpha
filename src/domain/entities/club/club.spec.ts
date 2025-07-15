import Club from './club';
import ClubMembership from '../club-membership/club-membership.entity';
import {
  DomainException,
  EntityNotFoundException,
  InvalidOperationException,
} from '@/domain/exceptions/domain-exception';
import IdGenerator from '@/application/services/id-generator';
import { MembershipStatus } from '@/domain/enums/membership-status';

const mockIdGenerator: IdGenerator = {
  generate: jest.fn().mockImplementation(() => `mock-uuid-${Math.random()}`),
};

describe('Club Aggregate Root', () => {
  let club: Club;
  const clubProps = { principalId: 'user-1', name: 'Alpha Debaters', city: 'Metropolis' };
  const dependantId1 = 'dependant-001';
  const familyId1 = 'family-001';

  beforeEach(() => {
    (mockIdGenerator.generate as jest.Mock).mockClear();
    club = Club.create(clubProps, mockIdGenerator);
  });

  describe('Creation', () => {
    it('Deve ser criado com sucesso através do método de fábrica estático', () => {
      expect(club).toBeInstanceOf(Club);
      expect(club.name).toBe(clubProps.name);
      expect(club.city).toBe(clubProps.city);
      expect(club.principalId).toBe(clubProps.principalId);
      expect(club.members).toHaveLength(0);
      expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
    });

    it('Deve falhar ao criar um clube com nome inválido', () => {
      expect(() => Club.create({ ...clubProps, name: 'A' }, mockIdGenerator)).toThrow(
        new DomainException('Club name is required and must have at least 3 characters.'),
      );
    });
  });

  describe('Member Management Invariants', () => {
    it('Deve adicionar um novo membro com sucesso', () => {
      club.addMember(dependantId1, familyId1, mockIdGenerator);

      expect(club.members).toHaveLength(1);
      const member = club.members[0];
      expect(member).toBeInstanceOf(ClubMembership);
      expect(member.memberId).toBe(dependantId1);
      expect(member.isActive()).toBe(true);
    });

    it('Deve lançar uma exceção ao tentar adicionar um membro que já está ativo', () => {
      club.addMember(dependantId1, familyId1, mockIdGenerator);

      expect(() => club.addMember(dependantId1, familyId1, mockIdGenerator)).toThrow(
        new InvalidOperationException(`Dependant ${dependantId1} is already an active member of this club.`),
      );
    });

    it('Deve remover (revogar) um membro ativo com sucesso', () => {
      club.addMember(dependantId1, familyId1, mockIdGenerator);
      club.removeMember(dependantId1);

      const member = club.members[0];
      expect(member.isActive()).toBe(false);
      expect(member.status).toBe(MembershipStatus.REVOKED);
    });

    it('Deve lançar uma exceção ao tentar remover um membro que não está ativo', () => {
      expect(() => club.removeMember('non-existent-dependant')).toThrow(
        new EntityNotFoundException('ClubMembership', `non-existent-dependant is not an active member of this club.`),
      );
    });

    it('Deve reativar um membro previamente removido ao adicioná-lo novamente', () => {
      club.addMember(dependantId1, familyId1, mockIdGenerator);
      club.removeMember(dependantId1);

      let member = club.members[0];
      expect(member.isActive()).toBe(false);

      club.addMember(dependantId1, familyId1, mockIdGenerator);

      expect(club.members).toHaveLength(1);
      member = club.members[0];
      expect(member.isActive()).toBe(true);
      expect(member.status).toBe(MembershipStatus.ACTIVE);
    });
  });
});
