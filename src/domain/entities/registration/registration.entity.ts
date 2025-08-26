import IdGenerator from '@/application/services/id-generator';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import { RegistrationType } from '@/domain/enums/registration-type.enum';

export default class Registration {
  private readonly _id: string;
  private readonly _tournamentId: string;
  private readonly _competitorId: string;
  private _status: RegistrationStatus;
  private readonly _type: RegistrationType;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: RegistrationConstructorProps) {
    this._id = props.id;
    this._tournamentId = props.tournamentId;
    this._competitorId = props.competitorId;
    this._status = props.status;
    this._type = props.type;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(tournamentId: string, competitorId: string, idGenerator: IdGenerator): Registration {
    const now = new Date();
    return new Registration({
      id: idGenerator.generate(),
      tournamentId,
      competitorId,
      status: RegistrationStatus.CONFIRMED,
      type: RegistrationType.INDIVIDUAL,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this._id;
  }

  get tournamentId(): string {
    return this._tournamentId;
  }

  get competitorId(): string {
    return this._competitorId;
  }

  get status(): RegistrationStatus {
    return this._status;
  }

  get type(): RegistrationType {
    return this._type;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public cancel(): void {
    if (this._status === RegistrationStatus.CANCELLED) {
      throw new Error('Registration is already cancelled');
    }

    this._status = RegistrationStatus.CANCELLED;
    this._updatedAt = new Date();
  }
}

interface RegistrationConstructorProps {
  id: string;
  tournamentId: string;
  competitorId: string;
  status: RegistrationStatus;
  type: RegistrationType;
  createdAt: Date;
  updatedAt: Date;
}
