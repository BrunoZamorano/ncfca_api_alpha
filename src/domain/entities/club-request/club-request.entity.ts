import { DomainException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import Address from '@/domain/value-objects/address/address';

export default class ClubRequest {
  private readonly _id: string;
  private readonly _address: Address;
  private readonly _clubName: string;
  private readonly _maxMembers?: number;
  private readonly _requestedAt: Date;
  private readonly _requesterId: string;
  private _status: ClubRequestStatus;
  private _resolvedAt: Date | null;
  private _rejectionReason: string | null;

  constructor(props: ClubRequestProps) {
    if ( props.maxMembers && props.maxMembers < 1) throw new InvalidOperationException('Max members must be greater than 0.');
    this._id = props.id;
    this._clubName = props.clubName;
    this._address = props.address;
    this._maxMembers = props.maxMembers;
    this._requesterId = props.requesterId;
    this._requestedAt = props.requestedAt ?? new Date();
    this._status = props.status ?? ClubRequestStatus.PENDING;
    this._rejectionReason = props.rejectionReason ?? null;
    this._resolvedAt = props.resolvedAt ?? null;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get clubName(): string {
    return this._clubName;
  }

  get address(): Address {
    return this._address;
  }

  get requesterId(): string {
    return this._requesterId;
  }

  get maxMembers() {
    return this._maxMembers;
  }

  get requestedAt(): Date {
    return this._requestedAt;
  }

  get status(): ClubRequestStatus {
    return this._status;
  }

  get rejectionReason(): string | null {
    return this._rejectionReason;
  }

  get resolvedAt(): Date | null {
    return this._resolvedAt;
  }

  // Public methods
  approve(): void {
    this.validateCanApprove();
    this.setStatus(ClubRequestStatus.APPROVED);
    this.setResolvedAt(new Date());
    this.setRejectionReason(null);
    // TODO: Disparar evento ClubRequestApproved
  }

  reject(reason: string): void {
    this.validateCanReject();
    this.validateRejectionReason(reason);
    this.setStatus(ClubRequestStatus.REJECTED);
    this.setRejectionReason(reason.trim());
    this.setResolvedAt(new Date());
    // TODO: Disparar evento ClubRequestRejected
  }

  isPending(): boolean {
    return this._status === ClubRequestStatus.PENDING;
  }

  isApproved(): boolean {
    return this._status === ClubRequestStatus.APPROVED;
  }

  isRejected(): boolean {
    return this._status === ClubRequestStatus.REJECTED;
  }

  // Private methods
  private validateCanApprove(): void {
    if (this._status !== ClubRequestStatus.PENDING) {
      throw new InvalidOperationException(`Cannot approve a club request that is already in status ${this._status}.`);
    }
  }

  private validateCanReject(): void {
    if (this._status !== ClubRequestStatus.PENDING) {
      throw new InvalidOperationException(`Cannot reject a club request that is already in status ${this._status}.`);
    }
  }

  private validateRejectionReason(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new DomainException('Motivo da rejeição é obrigatório');
    }
  }

  private setStatus(status: ClubRequestStatus): void {
    this._status = status;
  }

  private setRejectionReason(reason: string | null): void {
    this._rejectionReason = reason;
  }

  private setResolvedAt(date: Date): void {
    this._resolvedAt = date;
  }
}

export interface ClubRequestProps {
  id: string;
  status?: ClubRequestStatus;
  clubName: string;
  address: Address;
  maxMembers?: number;
  resolvedAt?: Date | null;
  requesterId: string;
  requestedAt?: Date;
  rejectionReason?: string | null;
}
