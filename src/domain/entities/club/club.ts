export default class Club {
  private readonly _affiliatedFamilies: string[] = [];
  private readonly _ownerId: string;
  private readonly _id: string;

  constructor(props: Props) {
    this.addAffiliatedFamily(props.ownerId);
    this._ownerId = props.ownerId;
    this._id = props.id;
  }

  get affiliatedFamilies(): string[] {
    return [...this._affiliatedFamilies];
  }

  get ownerId(): string {
    return this._ownerId;
  }

  get id(): string {
    return this._id;
  }

  addAffiliatedFamily(familyId: string): void {
    if (this._affiliatedFamilies.includes(familyId)) throw new Error(Club.errorCodes.ALREADY_AFFILIATED);
    this._affiliatedFamilies.push(familyId);
  }

  static errorCodes = {
    ALREADY_AFFILIATED: 'ALREADY_AFFILIATED',
  };
}

interface Props {
  members?: string[];
  ownerId: string;
  id: string;
}
