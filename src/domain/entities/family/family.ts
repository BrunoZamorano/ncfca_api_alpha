import { FamilyStatus } from '@/domain/enums/family-status';
import Dependant, { UpdateDependantProps } from '@/domain/entities/dependant/dependant';
import { DomainException, EntityNotFoundException } from '@/domain/exceptions/domain-exception';

export default class Family {
  private _status: FamilyStatus;
  private _dependants: Dependant[];
  private _affiliatedAt: Date | null;
  private _affiliationExpiresAt: Date | null;
  private readonly _holderId: string;
  private readonly _id: string;

  public constructor(props: FamilyProps) {
    this._id = props.id;
    this._holderId = props.holderId;
    this._dependants = props.dependants ?? [];
    this._status = props.status ?? FamilyStatus.NOT_AFFILIATED;
    this._affiliatedAt = props.affiliatedAt ?? null;
    this._affiliationExpiresAt = props.affiliationExpiresAt ?? null;
  }

  public isAffiliated(): boolean {
    if (this.status !== FamilyStatus.AFFILIATED) return false;
    if (!this._affiliationExpiresAt) return false;
    return this._affiliationExpiresAt > new Date();
  }

  public activateAffiliation(): void {
    if (this.status === FamilyStatus.AFFILIATED && this.isAffiliated()) {
      throw new DomainException('Family is already actively affiliated.');
    }
    const now = new Date();
    this._status = FamilyStatus.AFFILIATED;
    this._affiliatedAt = now;
    const expiration = new Date(now);
    expiration.setFullYear(expiration.getFullYear() + 1);
    this._affiliationExpiresAt = expiration;
  }

  public renewAffiliation(): void {
    if (this.status !== FamilyStatus.EXPIRED && this.status !== FamilyStatus.AFFILIATED) {
      throw new DomainException(`Cannot renew an affiliation with status '${this.status}'.`);
    }
    const now = new Date();
    const baseDate = this._affiliationExpiresAt && this._affiliationExpiresAt > now ? this._affiliationExpiresAt : now;

    const newExpiration = new Date(baseDate);
    newExpiration.setFullYear(newExpiration.getFullYear() + 1);

    this._status = FamilyStatus.AFFILIATED;
    this._affiliatedAt = now;
    this._affiliationExpiresAt = newExpiration;
  }

  public markAsExpired(): void {
    if (this.status !== FamilyStatus.AFFILIATED) {
      throw new DomainException('Only affiliated families can be marked as expired.');
    }
    if (this.isAffiliated()) {
      throw new DomainException('Cannot mark an active affiliation as expired.');
    }
    this._status = FamilyStatus.EXPIRED;
  }

  public addDependant(dependant: Dependant): void {
    if (this._dependants.some((d) => d.id === dependant.id)) {
      throw new DomainException('Dependant is already a member of this family.');
    }
    this._dependants.push(dependant);
  }

  public removeDependant(dependantId: string): void {
    const initialLength = this._dependants.length;
    this._dependants = this._dependants.filter((d) => d.id !== dependantId);
    if (this._dependants.length === initialLength) {
      throw new EntityNotFoundException('Dependant', dependantId);
    }
  }

  public updateDependantInfo(dependantId: string, info: UpdateDependantProps): void {
    const dependantToUpdate = this._dependants.find((d) => d.id === dependantId);

    if (!dependantToUpdate) {
      throw new EntityNotFoundException('Dependant', dependantId);
    }
    const newFirstName = info.firstName ?? dependantToUpdate.firstName;
    const newLastName = info.lastName ?? dependantToUpdate.lastName;
    const hasDuplicateName = this._dependants.some((d) => d.id !== dependantId && d.firstName === newFirstName && d.lastName === newLastName);

    if (hasDuplicateName) {
      throw new DomainException(`A dependant named ${newFirstName} ${newLastName} already exists in this family.`);
    }

    dependantToUpdate.updateInfo(info);
  }

  get id(): string {
    return this._id;
  }
  get holderId(): string {
    return this._holderId;
  }
  get status(): FamilyStatus {
    return this._status;
  }
  get affiliatedAt(): Date | null {
    return this._affiliatedAt;
  }
  get affiliationExpiresAt(): Date | null {
    return this._affiliationExpiresAt;
  }
  get dependants(): Dependant[] {
    return [...this._dependants];
  }
}

interface FamilyProps {
  id: string;
  holderId: string;
  dependants?: Dependant[];
  status?: FamilyStatus;
  affiliatedAt?: Date | null;
  affiliationExpiresAt?: Date | null;
}
