import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import IdGenerator from '@/application/services/id-generator';

//todo: move to a new file in domain/enum/ folder. follow rules : @./cursor/rules/*.mdc
export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

export default class RegistrationSync {
  private readonly _id: string;
  private readonly _registrationId: string;
  private readonly _createdAt: Date;
  private _status: SyncStatus;
  private _attempts: number;
  private _updatedAt: Date;
  private _lastAttemptAt: Date | null;
  private _nextAttemptAt: Date | null;

  constructor(props: RegistrationSyncConstructorProps) {
    this._id = props.id;
    this._registrationId = props.registrationId;
    this._status = props.status;
    this._attempts = props.attempts || 0;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._lastAttemptAt = props.lastAttemptAt || null;
    this._nextAttemptAt = props.nextAttemptAt || null;
  }

  public static create(registrationId: string, idGenerator: IdGenerator): RegistrationSync {
    const now = new Date();
    return new RegistrationSync({
      id: idGenerator.generate(),
      registrationId,
      status: SyncStatus.PENDING,
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      lastAttemptAt: null,
      nextAttemptAt: null,
    });
  }

  public static fromPersistence(props: RegistrationSyncConstructorProps): RegistrationSync {
    return new RegistrationSync(props);
  }

  public updateSyncStatus(status: SyncStatus): void {
    if (this._status === status) {
      return;
    }

    this._status = status;
    this._updatedAt = new Date();

    if (status === SyncStatus.SYNCED) {
      this._nextAttemptAt = null;
    }
  }

  public incrementRetryAttempt(): void {
    const maxRetries = 3;

    if (this._attempts >= maxRetries) {
      throw new InvalidOperationException(`Maximum retry attempts (${maxRetries}) reached for RegistrationSync ${this._id}`);
    }

    this._attempts++;
    this._lastAttemptAt = new Date();
    this._updatedAt = new Date();
    this._status = SyncStatus.PENDING;

    // Calculate next attempt time with exponential backoff
    const backoffMinutes = Math.pow(2, this._attempts) * 5; // 5, 10, 20 minutes
    this._nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
  }

  public isMaxRetriesReached(): boolean {
    return this._attempts >= 3;
  }

  public markAsFailed(): void {
    this._status = SyncStatus.FAILED;
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id;
  }

  get registrationId(): string {
    return this._registrationId;
  }

  get status(): SyncStatus {
    return this._status;
  }

  get attempts(): number {
    return this._attempts;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastAttemptAt(): Date | null {
    return this._lastAttemptAt;
  }

  get nextAttemptAt(): Date | null {
    return this._nextAttemptAt;
  }
}

interface RegistrationSyncConstructorProps {
  id: string;
  registrationId: string;
  status: SyncStatus;
  attempts?: number;
  createdAt: Date;
  updatedAt: Date;
  lastAttemptAt?: Date | null;
  nextAttemptAt?: Date | null;
}
