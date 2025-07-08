import { DomainException } from '@/domain/exceptions/domain-exception';
import { UserRoles } from '@/domain/enums/user-roles';
import HashingService from '@/domain/services/hashing-service';
import Password from '@/domain/value-objects/password/password';
import Cpf from '@/domain/value-objects/cpf/cpf';
import Address, { AddressProps } from '@/domain/value-objects/address/address';

export default class User {
  private readonly _address: Address;
  private readonly _roles: UserRoles[] = [];
  private readonly _cpf: Cpf;
  private readonly _id: string;
  private _firstName: string;
  private _password: Password;
  private _lastName: string;
  private _email: string;
  private _phone: string;

  public constructor(props: Props) {
    this._address = new Address(props.address ?? {});
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
    return this._email;
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

  public updateProfile(input: Partial<Omit<Props, 'cpf' | 'id' | 'password' | 'roles'>>): void {
    if (input.firstName) this._firstName = input.firstName;
    if (input.lastName) this._lastName = input.lastName;
    if (input.email) this._email = input.email;
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

  static errorCodes = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    DUPLICATED_ROLES: 'DUPLICATED_ROLES',
    SAME_PASSWORD: 'SAME_PASSWORD',
  };

  static readonly DEFAULT_PHONE = '99 99999-9999';
  static readonly DEFAULT_EMAIL = 'default@email.com';
  static readonly DEFAULT_PASSWORD = '<P@ssw0rd>';
  static readonly DEFAULT_LAST_NAME = '<DEFAULT_LAST_NAME>';
  static readonly DEFAULT_FIRST_NAME = '<DEFAULT_FIRST_NAME>';
}

interface Props {
  address?: AddressProps;
  firstName: string;
  lastName: string;
  password: Password;
  email: string;
  phone: string;
  cpf: Cpf;
  id: string;
}
