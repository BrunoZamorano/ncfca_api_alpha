import { FamilyStatus } from '@/domain/enums/family-status';

export default class Family {
  private _status: FamilyStatus;
  private readonly _dependants: string[] = [];
  private readonly _holderId: string;
  private readonly _id: string;

  constructor(props: Props) {
    this._holderId = props.holderId;
    this._status = props.status ?? FamilyStatus.NOT_AFFILIATED;
    this._id = props.id;
  }

  get dependants(): string[] {
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

  addDependant(dependantId: string): void {
    if (this._dependants.includes(dependantId)) throw new Error(Family.errorCodes.ALREADY_MEMBER);
    this._dependants.push(dependantId);
  }

  static errorCodes = {
    ALREADY_MEMBER: 'ALREADY_MEMBER',
  };
}

interface Props {
  dependants?: string[];
  holderId: string;
  status?: FamilyStatus;
  id: string;
}
