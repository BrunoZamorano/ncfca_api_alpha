import IdGenerator from '@/application/services/id-generator';

import Address, { AddressProps } from '@/domain/value-objects/address/address';
import { DomainException } from '@/domain/exceptions/domain-exception';
import HashingService from '@/domain/services/hashing-service';
import { UserRoles } from '@/domain/enums/user-roles';
import Password from '@/domain/value-objects/password/password';
import Email from '@/domain/value-objects/email/email';
import Cpf from '@/domain/value-objects/cpf/cpf';
import { UserErrorCode } from '@/domain/entities/user/user.error-code';

export default class User {
  private _roles: UserRoles[];
  private _firstName: string;
  private _lastName: string;
  private _password: Password;
  private _address: Address;
  private _email: Email;
  private _phone: string;
  private readonly _cpf: Cpf;
  private readonly _rg: string;
  private readonly _id: string;

  public constructor(props: UserConstructorProps) {
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._password = props.password;
    this._address = props.address;
    this._roles = props.roles;
    this._phone = props.phone;
    this._email = props.email;
    this._cpf = props.cpf;
    this._rg = props.rg;
    this._id = props.id;
  }
  //todo: 
  public static create(props: CreateUserProps, idGenerator: IdGenerator, hashingService: HashingService): User {
    const id = props.id ?? idGenerator!.generate();
    const password = Password.create(props.password ?? User.DEFAULT_PASSWORD, hashingService!);
    const roles = props.roles ?? [UserRoles.SEM_FUNCAO];
    if (!roles.includes(UserRoles.SEM_FUNCAO)) roles.push(UserRoles.SEM_FUNCAO);
    return new User({
      id,
      rg: props.rg ?? User.DEFAULT_RG,
      cpf: new Cpf(props.cpf ?? Cpf.VALID_CPF),
      roles,
      email: new Email(props.email ?? User.DEFAULT_EMAIL),
      phone: props.phone ?? User.DEFAULT_PHONE,
      address: new Address(props.address ?? {}),
      password,
      lastName: props.lastName ?? User.DEFAULT_LAST_NAME,
      firstName: props.firstName ?? User.DEFAULT_FIRST_NAME,
    });
  }

  public changePassword(oldPassword: string, newPassword: string, hashingService: HashingService): void {
    if (!this._password.compare(oldPassword, hashingService)) {
      throw new DomainException(UserErrorCode.INVALID_CREDENTIALS);
    }
    if (this._password.compare(newPassword, hashingService)) {
      throw new DomainException('New password cannot be the same as the old password.');
    }
    this._password = Password.create(newPassword, hashingService);
  }

  public updateProfile(input: UpdateProfileProps): void {
    if (input.firstName) this._firstName = input.firstName;
    if (input.lastName) this._lastName = input.lastName;
    if (input.address) this._address = new Address(input.address);
    if (input.email) this._email = new Email(input.email);
    if (input.phone) this._phone = input.phone;
  }

  public assignRoles(roles: UserRoles[]): void {
    this._roles = [...new Set([...roles, UserRoles.SEM_FUNCAO])];
  }

  public revokeRole(role: UserRoles): void {
    if (role === UserRoles.SEM_FUNCAO) {
      throw new DomainException(UserErrorCode.CANNOT_REVOKE_DEFAULT_ROLE);
    }
    this._roles = this._roles.filter((r) => r !== role);
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
  get email(): string {
    return this._email.value;
  }
  get password(): string {
    return this._password.value;
  }
  get phone(): string {
    return this._phone;
  }
  get cpf(): string {
    return this._cpf.value;
  }
  get rg(): string {
    return this._rg;
  }
  get roles(): UserRoles[] {
    return this._roles;
  }
  get address(): Address {
    return this._address;
  }

  static readonly DEFAULT_RG = '<DEFAULT_RG>';
  static readonly DEFAULT_PHONE = '99 99999-9999';
  static readonly DEFAULT_EMAIL = 'default@email.com';
  static readonly DEFAULT_PASSWORD = '<P@ssw0rd>';
  static readonly DEFAULT_LAST_NAME = '<DEFAULT_LAST_NAME>';
  static readonly DEFAULT_FIRST_NAME = '<DEFAULT_FIRST_NAME>';
}

export interface UserConstructorProps {
  id: string;
  firstName: string;
  lastName: string;
  email: Email;
  password: Password;
  phone: string;
  cpf: Cpf;
  rg: string;
  roles: UserRoles[];
  address: Address;
}

export interface CreateUserProps {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  roles?: UserRoles[];
  address?: AddressProps;
}

export interface UpdateProfileProps {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: AddressProps;
}
