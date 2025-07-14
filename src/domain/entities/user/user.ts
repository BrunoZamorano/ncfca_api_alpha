import { DomainException } from '@/domain/exceptions/domain-exception';
import { UserRoles } from '@/domain/enums/user-roles';
import HashingService from '@/domain/services/hashing-service';
import Password from '@/domain/value-objects/password/password';
import Cpf from '@/domain/value-objects/cpf/cpf';
import Address, { AddressProps } from '@/domain/value-objects/address/address';
import Email from '@/domain/value-objects/email/email';

export default class User {
  private readonly _cpf: Cpf;
  private readonly _id: string;
  private readonly _rg: string;
  private _firstName: string;
  private _password: Password;
  private _lastName: string;
  private _address: Address;
  private _roles: UserRoles[] = [];
  private _email: Email;
  private _phone: string;

  public constructor(props: UserProps) {
    this._address = new Address(props.address ?? {});
    this._rg = props.rg;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._password = props.password;
    this._email = props.email;
    this._phone = props.phone;
    this._cpf = props.cpf;
    this._id = props.id;
  }

  get address() {
    return this._address;
  }

  get firstName() {
    return this._firstName;
  }

  get lastName() {
    return this._lastName;
  }

  get password() {
    return this._password.value;
  }

  get email() {
    return this._email.value;
  }

  get phone() {
    return this._phone;
  }

  get roles() {
    return this._roles;
  }

  get cpf(): string {
    return this._cpf.value;
  }

  get rg(): string {
    return this._rg;
  }

  get id(): string {
    return this._id;
  }

  public changePassword(oldPassword: string, newPassword: string, hashingService: HashingService): void {
    if (!this._password.compare(oldPassword, hashingService))
      throw new DomainException(User.errorCodes.INVALID_CREDENTIALS);
    if (this._password.compare(newPassword, hashingService)) throw new DomainException(User.errorCodes.SAME_PASSWORD);
    this._password = Password.create(newPassword, hashingService);
    return void 0;
  }

  public updateProfile(input: UpdateProps): void {
    if (input.firstName) this._firstName = input.firstName;
    if (input.lastName) this._lastName = input.lastName;
    if (input.address) this._address = new Address(input.address);
    if (input.email) this._email = new Email(input.email);
    if (input.phone) this._phone = input.phone;
    return void 0;
  }

  addRoles(roles: UserRoles[]): void {
    for (const role of roles) {
      if (this._roles.includes(role)) throw new Error(User.errorCodes.DUPLICATED_ROLES);
      this._roles.push(role);
    }
    return void 0;
  }

  public revokeRole(role: UserRoles): void {
    this._roles = this._roles.filter((r) => r !== role);
  }

  static errorCodes = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    DUPLICATED_ROLES: 'DUPLICATED_ROLES',
    SAME_PASSWORD: 'SAME_PASSWORD',
  };
  
  static readonly DEFAULT_RG = '<DEFAULT_RG>';
  static readonly DEFAULT_PHONE = '99 99999-9999';
  static readonly DEFAULT_EMAIL = 'default@email.com';
  static readonly DEFAULT_PASSWORD = '<P@ssw0rd>';
  static readonly DEFAULT_LAST_NAME = '<DEFAULT_LAST_NAME>';
  static readonly DEFAULT_FIRST_NAME = '<DEFAULT_FIRST_NAME>';
}

interface UserProps {
  firstName: string;
  lastName: string;
  password: Password;
  address?: AddressProps;
  email: Email;
  phone: string;
  cpf: Cpf;
  rg: string;
  id: string;
}

interface UpdateProps {
  firstName?: string;
  lastName?: string;
  address?: AddressProps;
  phone?: string;
  email?: string;
}
