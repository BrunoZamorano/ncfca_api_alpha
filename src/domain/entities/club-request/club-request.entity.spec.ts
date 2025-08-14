import { DomainException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import ClubRequest from './club-request.entity';
import Address from '@/domain/value-objects/address/address';

describe('ClubRequest', () => {
  const mockAddress = new Address({
    street: 'Rua Teste',
    number: '123',
    district: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
  });

  const mockProps = {
    id: 'club-request-1',
    clubName: 'Clube Teste',
    address: mockAddress,
    requesterId: 'user-1',
  };

  describe('constructor', () => {
    it('should create a club request with default values', () => {
      const clubRequest = new ClubRequest(mockProps);

      expect(clubRequest.id).toBe(mockProps.id);
      expect(clubRequest.clubName).toBe(mockProps.clubName);
      expect(clubRequest.address).toBe(mockProps.address);
      expect(clubRequest.requesterId).toBe(mockProps.requesterId);
      expect(clubRequest.status).toBe(ClubRequestStatus.PENDING);
      expect(clubRequest.rejectionReason).toBeNull();
      expect(clubRequest.resolvedAt).toBeNull();
      expect(clubRequest.requestedAt).toBeInstanceOf(Date);
    });

    it('should create a club request with custom values', () => {
      const customDate = new Date('2023-01-01');
      const customProps = {
        ...mockProps,
        requestedAt: customDate,
        status: ClubRequestStatus.APPROVED,
        rejectionReason: null,
        resolvedAt: customDate,
      };

      const clubRequest = new ClubRequest(customProps);

      expect(clubRequest.requestedAt).toBe(customDate);
      expect(clubRequest.status).toBe(ClubRequestStatus.APPROVED);
      expect(clubRequest.rejectionReason).toBeNull();
      expect(clubRequest.resolvedAt).toBe(customDate);
    });
  });

  describe('approve', () => {
    it('should approve a pending club request', () => {
      const clubRequest = new ClubRequest(mockProps);
      const beforeResolvedAt = new Date();

      clubRequest.approve();

      expect(clubRequest.status).toBe(ClubRequestStatus.APPROVED);
      expect(clubRequest.rejectionReason).toBeNull();
      expect(clubRequest.resolvedAt).toBeInstanceOf(Date);
      expect(clubRequest.resolvedAt!.getTime()).toBeGreaterThanOrEqual(beforeResolvedAt.getTime());
    });

    it('should throw InvalidOperationException when trying to approve an already approved request', () => {
      const clubRequest = new ClubRequest({
        ...mockProps,
        status: ClubRequestStatus.APPROVED,
      });

      expect(() => clubRequest.approve()).toThrow(InvalidOperationException);
      expect(() => clubRequest.approve()).toThrow('Cannot approve a club request that is already in status APPROVED.');
    });

    it('should throw InvalidOperationException when trying to approve a rejected request', () => {
      const clubRequest = new ClubRequest({
        ...mockProps,
        status: ClubRequestStatus.REJECTED,
      });

      expect(() => clubRequest.approve()).toThrow(InvalidOperationException);
      expect(() => clubRequest.approve()).toThrow('Cannot approve a club request that is already in status REJECTED.');
    });
  });

  describe('reject', () => {
    it('should reject a pending club request with a valid reason', () => {
      const clubRequest = new ClubRequest(mockProps);
      const reason = 'Documentação incompleta';
      const beforeResolvedAt = new Date();

      clubRequest.reject(reason);

      expect(clubRequest.status).toBe(ClubRequestStatus.REJECTED);
      expect(clubRequest.rejectionReason).toBe(reason);
      expect(clubRequest.resolvedAt).toBeInstanceOf(Date);
      expect(clubRequest.resolvedAt!.getTime()).toBeGreaterThanOrEqual(beforeResolvedAt.getTime());
    });

    it('should throw InvalidOperationException when trying to reject an already approved request', () => {
      const clubRequest = new ClubRequest({
        ...mockProps,
        status: ClubRequestStatus.APPROVED,
      });

      expect(() => clubRequest.reject('reason')).toThrow(InvalidOperationException);
      expect(() => clubRequest.reject('reason')).toThrow('Cannot reject a club request that is already in status APPROVED.');
    });

    it('should throw InvalidOperationException when trying to reject an already rejected request', () => {
      const clubRequest = new ClubRequest({
        ...mockProps,
        status: ClubRequestStatus.REJECTED,
      });

      expect(() => clubRequest.reject('reason')).toThrow(InvalidOperationException);
      expect(() => clubRequest.reject('reason')).toThrow('Cannot reject a club request that is already in status REJECTED.');
    });

    it('should throw DomainException when rejecting with empty reason', () => {
      const clubRequest = new ClubRequest(mockProps);

      expect(() => clubRequest.reject('')).toThrow(DomainException);
      expect(() => clubRequest.reject('')).toThrow('Motivo da rejeição é obrigatório');
    });

    it('should throw DomainException when rejecting with whitespace-only reason', () => {
      const clubRequest = new ClubRequest(mockProps);

      expect(() => clubRequest.reject('   ')).toThrow(DomainException);
      expect(() => clubRequest.reject('   ')).toThrow('Motivo da rejeição é obrigatório');
    });

    it('should trim the rejection reason', () => {
      const clubRequest = new ClubRequest(mockProps);
      const reason = '  Motivo com espaços  ';

      clubRequest.reject(reason);

      expect(clubRequest.rejectionReason).toBe('Motivo com espaços');
    });
  });

  describe('status check methods', () => {
    it('should return correct status for pending request', () => {
      const clubRequest = new ClubRequest(mockProps);

      expect(clubRequest.isPending()).toBe(true);
      expect(clubRequest.isApproved()).toBe(false);
      expect(clubRequest.isRejected()).toBe(false);
    });

    it('should return correct status for approved request', () => {
      const clubRequest = new ClubRequest({
        ...mockProps,
        status: ClubRequestStatus.APPROVED,
      });

      expect(clubRequest.isPending()).toBe(false);
      expect(clubRequest.isApproved()).toBe(true);
      expect(clubRequest.isRejected()).toBe(false);
    });

    it('should return correct status for rejected request', () => {
      const clubRequest = new ClubRequest({
        ...mockProps,
        status: ClubRequestStatus.REJECTED,
      });

      expect(clubRequest.isPending()).toBe(false);
      expect(clubRequest.isApproved()).toBe(false);
      expect(clubRequest.isRejected()).toBe(true);
    });
  });
});
