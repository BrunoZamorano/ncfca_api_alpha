import IdGenerator from '@/application/services/id-generator';
import { RegistrationStatus } from '@/domain/enums/registration-status.enum';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import RegistrationSync from './registration-sync.entity';

export default class Registration {
  private readonly _id: string;
  private readonly _tournamentId: string;
  private readonly _competitorId: string;
  private readonly _partnerId: string | null;
  private _status: RegistrationStatus;
  private readonly _type: TournamentType;
  private _version: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _sync: RegistrationSync;

  // Construtor privado - apenas Tournament pode criar Registration
  private constructor(props: RegistrationConstructorProps) {
    this._id = props.id;
    this._tournamentId = props.tournamentId;
    this._competitorId = props.competitorId;
    this._partnerId = props.partnerId || null;
    this._status = props.status;
    this._type = props.type;
    this._version = props.version || 1;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._sync = props.sync;
  }

  // Factory method interno usado apenas pelo Tournament
  public static createForTournament(tournamentId: string, competitorId: string, idGenerator: IdGenerator): Registration {
    const now = new Date();
    const registrationId = idGenerator.generate();
    const sync = RegistrationSync.create(registrationId, idGenerator);
    return new Registration({
      id: registrationId,
      type: TournamentType.INDIVIDUAL,
      sync,
      status: RegistrationStatus.CONFIRMED,
      createdAt: now,
      updatedAt: now,
      competitorId,
      tournamentId,
    });
  }

  // Factory method para registro de dupla com status pendente
  public static createDuoRegistrationForTournament(
    tournamentId: string,
    competitorId: string,
    partnerId: string,
    idGenerator: IdGenerator,
  ): Registration {
    const now = new Date();
    const registrationId = idGenerator.generate();
    const sync = RegistrationSync.create(registrationId, idGenerator);
    return new Registration({
      id: registrationId,
      type: TournamentType.DUO,
      partnerId,
      sync,
      status: RegistrationStatus.PENDING_APPROVAL,
      createdAt: now,
      updatedAt: now,
      competitorId,
      tournamentId,
    });
  }

  // Factory method for reconstruction from persistence
  public static fromPersistence(props: RegistrationConstructorProps): Registration {
    return new Registration(props);
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

  get partnerId(): string | null {
    return this._partnerId;
  }

  get status(): RegistrationStatus {
    return this._status;
  }

  get type(): TournamentType {
    return this._type;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get version(): number {
    return this._version;
  }

  get sync(): RegistrationSync {
    return this._sync;
  }

  public cancel(): void {
    if (this._status === RegistrationStatus.CANCELLED) throw new Error('Registration is already cancelled');
    this._status = RegistrationStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  public isConfirmed(): boolean {
    return this._status === RegistrationStatus.CONFIRMED;
  }
}

interface RegistrationConstructorProps {
  id: string;
  status: RegistrationStatus;
  type: TournamentType;
  partnerId?: string | null;
  version?: number;
  sync: RegistrationSync;
  createdAt: Date;
  updatedAt: Date;
  tournamentId: string;
  competitorId: string;
}
