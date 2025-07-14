import { DomainException } from '@/domain/exceptions/domain-exception';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { Sex } from '@/domain/enums/sex';
import Email from '@/domain/value-objects/email/email';

export default class Dependant {
  private _relationship: DependantRelationship;
  private _birthdate: Birthdate;
  private _firstName: string;
  private _lastName: string;
  private _familyId: string;
  private _phone?: string;
  private _email?: Email;
  private _sex: Sex;
  private readonly _id: string;

  constructor(props: DependantProps) {
    this.validateName(props.firstName, 'First name');
    this.validateName(props.lastName, 'Last name');

    this._id = props.id;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._birthdate = props.birthdate;
    this._relationship = props.relationship;
    this._sex = props.sex;
    this._email = props.email;
    this._phone = props.phone;
    this._familyId = props.familyId ?? 'id_family';
  }

  get id(): string {
    return this._id;
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
    if (input.birthdate) this._birthdate = new Birthdate(input.birthdate);
    if (input.relationship) this._relationship = input.relationship;
    if (input.sex) this._sex = input.sex;
    if (input.email) this._email = new Email(input.email);
    if (input.phone) this._phone = input.phone;
  }

  private validateName(name: string, field: string): void {
    if (!name || name.trim().length < 2) {
      throw new DomainException(`${field} is required and must have at least 2 characters.`);
    }
  }
}

interface DependantProps {
  id: string;
  firstName: string;
  lastName: string;
  birthdate: Birthdate;
  relationship: DependantRelationship;
  sex: Sex;
  email?: Email;
  phone?: string;
  familyId?: string;
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
