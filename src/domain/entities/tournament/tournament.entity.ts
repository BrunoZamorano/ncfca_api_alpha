import { InvalidOperationException, OptimisticLockError } from '@/domain/exceptions/domain-exception';
import { RegistrationConfirmed } from '@/domain/events/registration-confirmed.event';
import { TournamentType } from '@/domain/enums/tournament-type.enum';
import { EventEmitter } from '@/domain/events/event-emitter';
import Registration from '@/domain/entities/registration/registration.entity';
import Dependant from '@/domain/entities/dependant/dependant';

import IdGenerator from '@/application/services/id-generator';
import { ConflictException } from '@nestjs/common';

export default class Tournament {
  private readonly _id: string;
  private readonly _createdAt: Date;
  private _name: string;
  private _type: TournamentType;
  private _version: number;
  private _deletedAt: Date | null;
  private _updatedAt: Date;
  private _startDate: Date;
  private _description: string;
  private _registrations: Registration[];
  private _registrationEndDate: Date;
  private _registrationStartDate: Date;

  constructor(props: TournamentConstructorProps) {
    this._id = props.id;
    this._name = props.name;
    this._type = props.type;
    this._version = props.version || 1;
    this._startDate = props.startDate;
    this._deletedAt = props.deletedAt || null;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._description = props.description;
    this._registrations = props.registrations || [];
    this._registrationEndDate = props.registrationEndDate;
    this._registrationStartDate = props.registrationStartDate;
  }

  public static create(props: CreateTournamentProps, idGenerator: IdGenerator): Tournament {
    if (!props.name || props.name.trim().length < 3) throw new InvalidOperationException('Tournament name is required and must have at least 3 characters.');
    if (!props.description || props.description.trim().length < 10) throw new InvalidOperationException('Tournament description is required and must have at least 10 characters.');
    if (props.registrationEndDate <= props.registrationStartDate) throw new InvalidOperationException('Registration end date cannot be before or equal to the start date.');
    if (props.startDate < props.registrationEndDate) throw new InvalidOperationException('Tournament start date cannot be before registration end date.');
    return new Tournament({
      id: idGenerator.generate(),
      name: props.name.trim(),
      type: props.type,
      version: 1,
      startDate: props.startDate,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: props.description.trim(),
      registrations: [],
      registrationEndDate: props.registrationEndDate,
      registrationStartDate: props.registrationStartDate,
    });
  }

  public requestIndividualRegistration(competitor: Dependant, idGenerator: IdGenerator, eventEmitter: EventEmitter): Registration {
    this.validateCanModifyRegistrations();
    this.validateTournamentType(TournamentType.INDIVIDUAL);
    this.validateRegistrationPeriod();
    this.validateNotAlreadyRegistered(competitor.id);
    const newRegistration = Registration.createForTournament(this._id, competitor.id, idGenerator);
    this._registrations.push(newRegistration);
    this._updatedAt = new Date();
    this._version++;
    const event = new RegistrationConfirmed({
      registrationId: newRegistration.id,
      tournamentId: this._id,
      competitorId: competitor.id,
      isDuo: false,
    });
    eventEmitter.emit(event);
    return newRegistration;
  }

  public update(props: UpdateTournamentProps): void {
    if (this._registrations.length > 0) throw new InvalidOperationException('Cannot update a tournament that already has registrations.');
    if (this._deletedAt) throw new InvalidOperationException('Cannot update a deleted tournament.');
    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length < 3) throw new InvalidOperationException('Tournament name must have at least 3 characters.');
      this._name = props.name.trim();
    }
    if (props.description !== undefined) {
      if (!props.description || props.description.trim().length < 10) throw new InvalidOperationException('Tournament description must have at least 10 characters.');
      this._description = props.description.trim();
    }
    if (props.type !== undefined) this._type = props.type;
    if (props.registrationStartDate !== undefined) this._registrationStartDate = props.registrationStartDate;
    if (props.registrationEndDate !== undefined) this._registrationEndDate = props.registrationEndDate;
    if (props.startDate !== undefined) this._startDate = props.startDate;
    if (this._registrationEndDate <= this._registrationStartDate) throw new InvalidOperationException('Registration end date cannot be before or equal to the start date.');
    if (this._startDate < this._registrationEndDate) throw new InvalidOperationException('Tournament start date cannot be before registration end date.');
    this._updatedAt = new Date();
    this._version++;
  }

  public softDelete(): void {
    if (this._registrations.length > 0) throw new InvalidOperationException('Cannot delete a tournament that already has registrations.');
    if (this._deletedAt) throw new InvalidOperationException('Tournament is already deleted.');
    this._version++;
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  public isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  public cancelRegistration(registrationId: string): Registration {
    this.validateCanModifyRegistrations();
    const registration = this._registrations.find((reg) => reg.id === registrationId);
    if (!registration) throw new InvalidOperationException(`Registration with ID ${registrationId} not found in this tournament.`);
    registration.cancel();
    this._updatedAt = new Date();
    this._version++;
    return registration;
  }

  private isRegistrationOpen(): boolean {
    const now = new Date();
    return now >= this._registrationStartDate && now <= this._registrationEndDate;
  }

  private isCompetitorAlreadyRegistered(competitorId: string): boolean {
    return this._registrations.some((registration) => registration.competitorId === competitorId);
  }

  private validateTournamentType(expectedType: TournamentType): void {
    if (this._type !== expectedType) {
      throw new InvalidOperationException(`Cannot register for this tournament type. Tournament must be of type ${expectedType}.`);
    }
  }

  private validateRegistrationPeriod(): void {
    if (!this.isRegistrationOpen()) throw new InvalidOperationException('Registration period is not open for this tournament.');
  }

  private validateNotAlreadyRegistered(competitorId: string): void {
    if (this.isCompetitorAlreadyRegistered(competitorId)) throw new ConflictException('Registration', `${this._id}-${competitorId}`);
  }

  private validateTournamentNotDeleted(): void {
    if (this._deletedAt) throw new InvalidOperationException('Cannot perform operations on a deleted tournament.');
  }

  private validateCanModifyRegistrations(): void {
    this.validateTournamentNotDeleted();
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

  get registrations(): Readonly<Registration[]> {
    return this._registrations;
  }

  get version(): number {
    return this._version;
  }

}

export interface CreateTournamentProps {
  name: string;
  type: TournamentType;
  startDate: Date;
  description: string;
  registrationEndDate: Date;
  registrationStartDate: Date;
}

export interface UpdateTournamentProps {
  name?: string;
  type?: TournamentType;
  startDate?: Date;
  description?: string;
  registrationEndDate?: Date;
  registrationStartDate?: Date;
}

interface TournamentConstructorProps {
  id: string;
  name: string;
  type: TournamentType;
  version?: number;
  startDate: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  registrations?: Registration[];
  registrationEndDate: Date;
  registrationStartDate: Date;
}
