export default class Club {
  private readonly _affiliatedFamilies: string[] = [];
  private readonly _ownerId: string;
  private readonly _city: string;
  private readonly _name: string;
  private readonly _id: string;

  constructor(props: Props) {
    this.addAffiliatedFamilies(props.ownerId);
    this._ownerId = props.ownerId;
    this._city = props.city ?? Club.DEFAULT_CITY;
    this._name = props.name ?? Club.DEFAULT_NAME;
    this._id = props.id;
  }

  get affiliatedFamilies(): string[] {
    return [...this._affiliatedFamilies];
  }

  get ownerId(): string {
    return this._ownerId;
  }

  get city(): string {
    return this._city;
  }

  get name(): string {
    return this._name;
  }

  get id(): string {
    return this._id;
  }

  addAffiliatedFamilies(familyId: string): void {
    if (this._affiliatedFamilies.includes(familyId)) throw new Error(Club.errorCodes.ALREADY_AFFILIATED);
    this._affiliatedFamilies.push(familyId);
  }

  static errorCodes = {
    ALREADY_AFFILIATED: 'ALREADY_AFFILIATED',
  };

  static readonly DEFAULT_CITY = 'Boa Vista';
  static readonly DEFAULT_NAME = 'Club';
}

interface Props {
  affiliatedFamilies?: string[];
  ownerId: string;
  city?: string;
  name?: string;
  id: string;
}
