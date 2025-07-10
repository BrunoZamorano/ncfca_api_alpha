import { DomainException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { EnrollmentStatus } from '@/domain/enums/enrollment-status';

export default class EnrollmentRequest {
  public rejectionReason: string | null;
  public resolvedAt: Date | null;
  public status: EnrollmentStatus;
  public readonly dependantId: string;
  public readonly requestedAt: Date;
  public readonly familyId: string;
  public readonly clubId: string;
  public readonly id: string;

  public constructor(props: EnrollmentRequestProps) {
    this.rejectionReason = props.rejectionReason ?? null;
    this.dependantId = props.dependantId;
    this.requestedAt = props.requestedAt ?? new Date();
    this.resolvedAt = props.resolvedAt ?? null;
    this.familyId = props.familyId;
    this.status = props.status ?? EnrollmentStatus.Pending;
    this.clubId = props.clubId;
    this.id = props.id;
  }

  public approve(): void {
    if (this.status !== EnrollmentStatus.Pending)
      throw new InvalidOperationException(
        `Cannot approve an enrollment request that is already in status ${this.status}.`,
      );
    this.status = EnrollmentStatus.Approved;
    this.resolvedAt = new Date();
    this.rejectionReason = null;
    return void 0;
  }

  public reject(reason: string): void {
    if (this.status !== EnrollmentStatus.Pending) {
      throw new InvalidOperationException(
        `Cannot reject an enrollment request that is already in status ${this.status}.`,
      );
    }
    if (!reason || reason.length < 10) {
      throw new DomainException('A rejection reason with at least 10 characters is required.');
    }
    this.status = EnrollmentStatus.Rejected;
    this.resolvedAt = new Date();
    this.rejectionReason = reason;
    return void 0;
  }
}

export interface EnrollmentRequestProps {
  rejectionReason?: string | null;
  requestedAt?: Date;
  dependantId: string;
  resolvedAt?: Date | null;
  familyId: string;
  status?: EnrollmentStatus;
  clubId: string;
  id: string;
}
