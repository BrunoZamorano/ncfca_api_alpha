import { UserRoles } from '../../enums/user-roles';
import Cpf from '@/domain/value-objects/cpf/cpf';

export default class User {
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _password: string;
  private readonly _email: string;
  private readonly _roles: UserRoles[] = [];
  private readonly _cpf: Cpf;
  private readonly _id: string;

  constructor(props: Props) {
    this._roles.push(UserRoles.SEM_FUNCAO);
    this._firstName = props.firstName ?? 'Jose';
    this._lastName = props.lastName ?? 'Silva';
    this._password = props.password ?? User.DEFAULT_PASSWORD;
    this._email = props.email ?? User.DEFAULT_EMAIL;
    this._cpf = props.cpf ? new Cpf(props.cpf) : new Cpf();
    this._id = props.id;
    if (props.roles) this.addRoles(props.roles);
  }

  get firstName() {
    return this._firstName;
  }

  get lastName() {
    return this._lastName;
  }

  get password() {
    return this._password;
  }

  get email() {
    return this._email;
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

  private addRoles(roles: UserRoles[]): void {
    for (const role of roles) {
      if (this._roles.includes(role)) throw new Error(User.errorCodes.DUPLICATED_ROLES);
      this._roles.push(role);
    }
  }

  static errorCodes = {
    DUPLICATED_ROLES: 'DUPLICATED_ROLES',
  };

  static readonly DEFAULT_PASSWORD = '<PASSWORD>';
  static readonly DEFAULT_EMAIL = 'default@email.com';
}

interface Props {
  firstName?: string;
  password?: string;
  lastName?: string;
  email?: string;
  roles?: UserRoles[];
  cpf?: string;
  id: string;
}
