export default class Family {
  private readonly _dependants: string[] = [];
  private readonly _holderId: string;
  private readonly _id: string;

  constructor(props: Props) {
    this._holderId = props.holderId;
    this._id = props.id;
  }

  get dependants(): string[] {
    return [...this._dependants];
  }

  get holderId(): string {
    return this._holderId;
  }

  get id(): string {
    return this._id;
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
  id: string;
}
