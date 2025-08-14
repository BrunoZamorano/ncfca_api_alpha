import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { DomainException } from '@/domain/exceptions/domain-exception';
import { Sex } from '@/domain/enums/sex';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import Email from '@/domain/value-objects/email/email';
import { DependantType } from '@/domain/enums/dependant-type.enum';

export default class Dependant {
  private _relationship: DependantRelationship;
  private _birthdate: Birthdate;
  private _firstName: string;
  private _lastName: string;
  private _email: Email;
  private _phone?: string;
  private _sex: Sex;
  private readonly _familyId: string;
  private readonly _type: DependantType;
  private readonly _id: string;

  constructor(props: DependantProps) {
    this.validateName(props.firstName, 'First name');
    this.validateName(props.lastName, 'Last name');
    this._id = props.id;
    this._sex = props.sex;
    this._type = props.type ?? DependantType.STUDENT;
    this._email = props.email ?? new Email(`${crypto.randomUUID()}@ex.com`);
    this._phone = props.phone;
    this._lastName = props.lastName;
    this._familyId = props.familyId ?? 'id_family';
    this._firstName = props.firstName;
    this._birthdate = props.birthdate;
    this._relationship = props.relationship;
  }

  get id(): string {
    return this._id;
  }
  get type(): DependantType {
    return this._type;
  }
  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  get birthdate(): Date {
    return this._birthdate.value;
  }
  get relationship(): DependantRelationship {
    return this._relationship;
  }
  get sex(): Sex {
    return this._sex;
  }
  get email(): string | undefined {
    return this._email?.value;
  }
  get phone(): string | undefined {
    return this._phone;
  }
  get familyId() {
    return this._familyId;
  }

  public updateInfo(input: UpdateDependantProps): void {
    if (input.firstName) {
      this.validateName(input.firstName, 'First name');
      this._firstName = input.firstName;
    }
    if (input.lastName) {
      this.validateName(input.lastName, 'Last name');
      this._lastName = input.lastName;
    }
    if (input.relationship) this._relationship = input.relationship;
    if (input.birthdate) this._birthdate = new Birthdate(input.birthdate);
    if (input.email) this._email = new Email(input.email);
    if (input.phone) this._phone = input.phone;
    if (input.sex) this._sex = input.sex;
  }

  private validateName(name: string, field: string): void {
    if (!name || name.trim().length < 2) {
      throw new DomainException(`${field} is required and must have at least 2 characters.`);
    }
  }
}

interface DependantProps {
  relationship: DependantRelationship;
  birthdate: Birthdate;
  firstName: string;
  lastName: string;
  familyId?: string;
  email?: Email;
  phone?: string;
  type?: DependantType;
  sex: Sex;
  id: string;
}

export interface UpdateDependantProps {
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  relationship?: DependantRelationship;
  sex?: Sex;
  email?: string;
  phone?: string;
}
