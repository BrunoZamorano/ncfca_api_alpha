import { FamilyStatus } from '@/domain/enums/family-status';
import Dependant from '@/domain/entities/dependant/dependant';
import { DomainException } from '@/domain/exceptions/domain-exception';

export default class Family {
  private _status: FamilyStatus;
  private _dependants: Dependant[];
  private readonly _holderId: string;
  private readonly _id: string;

  constructor(props: Props) {
    this._dependants = props.dependants ?? [];
    this._holderId = props.holderId;
    this._status = props.status ?? FamilyStatus.NOT_AFFILIATED;
    this._id = props.id;
  }

  get dependants(): Dependant[] {
    return [...this._dependants];
  }

  get holderId(): string {
    return this._holderId;
  }

  get status(): FamilyStatus {
    return this._status;
  }

  get id(): string {
    return this._id;
  }

  activateAffiliation(): void {
    this._status = FamilyStatus.AFFILIATED;
  }

  addDependant(dependant: Dependant): void {
    if (this._dependants.some((p) => p.id === dependant.id)) throw new Error(Family.errorCodes.ALREADY_MEMBER);
    this._dependants.push(dependant);
  }

  public removeDependant(dependantId: string): void {
    const initialLength = this._dependants.length;
    this._dependants = this._dependants.filter((p) => p.id !== dependantId);
    if (initialLength === this._dependants.length) {
      throw new DomainException(`Dependant with id ${dependantId} not found in this family.`);
    }
    return void 0;
  }

  static errorCodes = {
    ALREADY_MEMBER: 'Dependant is already a member of this family.',
  };
}

interface Props {
  dependants?: Dependant[];
  holderId: string;
  status?: FamilyStatus;
  id: string;
}
