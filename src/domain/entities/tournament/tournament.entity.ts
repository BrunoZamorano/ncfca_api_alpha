import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import IdGenerator from '@/application/services/id-generator';
import Registration from '@/domain/entities/registration/registration.entity';
import Dependant from '@/domain/entities/dependant/dependant';

export default class Tournament {
  private readonly _id: string;
  private readonly _createdAt: Date;
  private _name: string;
  private _description: string;
  private _type: TournamentType;
  private _registrationStartDate: Date;
  private _registrationEndDate: Date;
  private _startDate: Date;
  private _deletedAt: Date | null;
  private _updatedAt: Date;
  private _registrationCount: number;
  private _registrations: Registration[];

  constructor(props: TournamentConstructorProps) {
    this._id = props.id;
    this._name = props.name;
    this._description = props.description;
    this._type = props.type;
    this._registrationStartDate = props.registrationStartDate;
    this._registrationEndDate = props.registrationEndDate;
    this._startDate = props.startDate;
    this._deletedAt = props.deletedAt || null;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._registrationCount = props.registrationCount || 0;
    this._registrations = props.registrations || [];
  }

  public static create(props: CreateTournamentProps, idGenerator: IdGenerator): Tournament {
    if (!props.name || props.name.trim().length < 3) {
      throw new InvalidOperationException('Tournament name is required and must have at least 3 characters.');
    }

    if (!props.description || props.description.trim().length < 10) {
      throw new InvalidOperationException('Tournament description is required and must have at least 10 characters.');
    }

    if (props.registrationEndDate <= props.registrationStartDate) {
      throw new InvalidOperationException('Registration end date cannot be before or equal to the start date.');
    }

    if (props.startDate < props.registrationEndDate) {
      throw new InvalidOperationException('Tournament start date cannot be before registration end date.');
    }

    const now = new Date();
    return new Tournament({
      id: idGenerator.generate(),
      name: props.name.trim(),
      description: props.description.trim(),
      type: props.type,
      registrationStartDate: props.registrationStartDate,
      registrationEndDate: props.registrationEndDate,
      startDate: props.startDate,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      registrationCount: 0,
      registrations: [],
    });
  }

  public update(props: UpdateTournamentProps): void {
    if (this._registrationCount > 0) {
      throw new InvalidOperationException('Cannot update a tournament that already has registrations.');
    }

    if (this._deletedAt) {
      throw new InvalidOperationException('Cannot update a deleted tournament.');
    }

    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length < 3) {
        throw new InvalidOperationException('Tournament name must have at least 3 characters.');
      }
      this._name = props.name.trim();
    }

    if (props.description !== undefined) {
      if (!props.description || props.description.trim().length < 10) {
        throw new InvalidOperationException('Tournament description must have at least 10 characters.');
      }
      this._description = props.description.trim();
    }

    if (props.type !== undefined) {
      this._type = props.type;
    }

    if (props.registrationStartDate !== undefined) {
      this._registrationStartDate = props.registrationStartDate;
    }

    if (props.registrationEndDate !== undefined) {
      this._registrationEndDate = props.registrationEndDate;
    }

    if (props.startDate !== undefined) {
      this._startDate = props.startDate;
    }

    if (this._registrationEndDate <= this._registrationStartDate) {
      throw new InvalidOperationException('Registration end date cannot be before or equal to the start date.');
    }

    if (this._startDate < this._registrationEndDate) {
      throw new InvalidOperationException('Tournament start date cannot be before registration end date.');
    }

    this._updatedAt = new Date();
  }

  public softDelete(): void {
    if (this._registrationCount > 0) {
      throw new InvalidOperationException('Cannot delete a tournament that already has registrations.');
    }

    if (this._deletedAt) {
      throw new InvalidOperationException('Tournament is already deleted.');
    }

    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  public isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  public requestIndividualRegistration(competitor: Dependant, idGenerator: IdGenerator): Registration {
    if (this._type !== TournamentType.INDIVIDUAL) {
      throw new InvalidOperationException('Cannot register for this tournament type. Tournament must be of type INDIVIDUAL.');
    }

    if (!this.isRegistrationOpen()) {
      throw new InvalidOperationException('Registration period is not open for this tournament.');
    }

    if (this.isCompetitorAlreadyRegistered(competitor.id)) {
      throw new InvalidOperationException(`Competitor ${competitor.firstName} ${competitor.lastName} is already registered for this tournament.`);
    }

    const newRegistration = Registration.create(this._id, competitor.id, idGenerator);
    this._registrations.push(newRegistration);
    this._registrationCount = this._registrations.length;
    this._updatedAt = new Date();

    return newRegistration;
  }

  private isRegistrationOpen(): boolean {
    const now = new Date();
    return now >= this._registrationStartDate && now <= this._registrationEndDate;
  }

  private isCompetitorAlreadyRegistered(competitorId: string): boolean {
    return this._registrations.some((registration) => registration.competitorId === competitorId);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get type(): TournamentType {
    return this._type;
  }

  get registrationStartDate(): Date {
    return this._registrationStartDate;
  }

  get registrationEndDate(): Date {
    return this._registrationEndDate;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get registrationCount(): number {
    return this._registrationCount;
  }

  get registrations(): Readonly<Registration[]> {
    return this._registrations;
  }
}

export interface CreateTournamentProps {
  name: string;
  description: string;
  type: TournamentType;
  registrationStartDate: Date;
  registrationEndDate: Date;
  startDate: Date;
}

export interface UpdateTournamentProps {
  name?: string;
  description?: string;
  type?: TournamentType;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  startDate?: Date;
}

interface TournamentConstructorProps {
  id: string;
  name: string;
  description: string;
  type: TournamentType;
  registrationStartDate: Date;
  registrationEndDate: Date;
  startDate: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  registrationCount?: number;
  registrations?: Registration[];
}
