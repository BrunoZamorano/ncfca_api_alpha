import { DomainException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status/enrollment-status';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';

describe('EnrollmentRequest Entity', () => {
  const baseProps = {
    id: 'enroll-1',
    dependantId: 'dep-1',
    familyId: 'family-1',
    clubId: 'club-1',
  };

  it('Deve criar uma nova solicitação com o status PENDING por padrão', () => {
    const request = new EnrollmentRequest(baseProps);
    expect(request.status).toBe(EnrollmentStatus.PENDING);
    expect(request.requestedAt).toBeInstanceOf(Date);
    expect(request.resolvedAt).toBeNull();
    expect(request.rejectionReason).toBeNull();
  });

  describe('approve', () => {
    it('Deve aprovar uma solicitação PENDING', () => {
      const request = new EnrollmentRequest(baseProps);
      request.approve();
      expect(request.status).toBe(EnrollmentStatus.APPROVED);
      expect(request.resolvedAt).toBeInstanceOf(Date);
    });

    it('Deve lançar uma exceção ao tentar aprovar uma solicitação já aprovada', () => {
      const request = new EnrollmentRequest({ ...baseProps, status: EnrollmentStatus.APPROVED });
      expect(() => request.approve()).toThrow(InvalidOperationException);
    });

    it('Deve lançar uma exceção ao tentar aprovar uma solicitação rejeitada', () => {
      const request = new EnrollmentRequest({ ...baseProps, status: EnrollmentStatus.REJECTED });
      expect(() => request.approve()).toThrow(InvalidOperationException);
    });
  });

  describe('reject', () => {
    it('Deve rejeitar uma solicitação PENDING com um motivo válido', () => {
      const request = new EnrollmentRequest(baseProps);
      const reason = 'Clube atingiu a capacidade máxima.';
      request.reject(reason);
      expect(request.status).toBe(EnrollmentStatus.REJECTED);
      expect(request.resolvedAt).toBeInstanceOf(Date);
      expect(request.rejectionReason).toBe(reason);
    });

    it('Deve lançar uma exceção se o motivo da rejeição for inválido', () => {
      const request = new EnrollmentRequest(baseProps);
      expect(() => request.reject('')).toThrow(DomainException);
      expect(() => request.reject('Curto')).toThrow(DomainException);
    });

    it('Deve lançar uma exceção ao tentar rejeitar uma solicitação já aprovada', () => {
      const request = new EnrollmentRequest({ ...baseProps, status: EnrollmentStatus.APPROVED });
      expect(() => request.reject('Motivo qualquer')).toThrow(InvalidOperationException);
    });
  });
});