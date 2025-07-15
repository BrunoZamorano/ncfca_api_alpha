import IdGenerator from '@/application/services/id-generator';

import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { MembershipStatus } from '@/domain/enums/membership-status';

import ClubMembership from './club-membership.entity';

const mockIdGenerator: IdGenerator = { generate: () => 'mock-membership-id' };

describe('ClubMembership Entity', () => {
  const createProps = {
    clubId: 'club-1',
    familyId: 'family-1',
    memberId: 'dependant-1',
  };

  it('Deve criar uma nova instância com status ACTIVE através do método de fábrica', () => {
    const membership = ClubMembership.create(createProps, mockIdGenerator);
    expect(membership).toBeInstanceOf(ClubMembership);
    expect(membership.id).toBe('mock-membership-id');
    expect(membership.status).toBe(MembershipStatus.ACTIVE);
    expect(membership.isActive()).toBe(true);
  });

  describe('revoke', () => {
    it('Deve alterar o status para REVOKED em um membro ativo', () => {
      const membership = ClubMembership.create(createProps, mockIdGenerator);
      membership.revoke();
      expect(membership.status).toBe(MembershipStatus.REVOKED);
      expect(membership.isActive()).toBe(false);
    });

    it('Deve lançar uma exceção ao tentar revogar um membro já revogado', () => {
      const membership = ClubMembership.create(createProps, mockIdGenerator);
      membership.revoke();
      expect(() => membership.revoke()).toThrow(
        new InvalidOperationException('Cannot revoke a membership that is not active.'),
      );
    });
  });

  describe('reinstate', () => {
    it('Deve alterar o status para ACTIVE em um membro revogado', () => {
      const membership = ClubMembership.create(createProps, mockIdGenerator);
      membership.revoke();
      membership.reinstate();
      expect(membership.status).toBe(MembershipStatus.ACTIVE);
      expect(membership.isActive()).toBe(true);
    });

    it('Deve lançar uma exceção ao tentar reativar um membro que já está ativo', () => {
      const membership = ClubMembership.create(createProps, mockIdGenerator);
      expect(() => membership.reinstate()).toThrow(
        new InvalidOperationException('Cannot reinstate a membership that is not revoked.'),
      );
    });
  });
});
