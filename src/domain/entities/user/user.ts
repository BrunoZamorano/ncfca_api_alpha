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

  constructor({ firstName = 'Jose', lastName = 'Silva', password = '<password>', ...props }: Props) {
    this._roles.push(UserRoles.SEM_FUNCAO);
    this._firstName = firstName;
    this._lastName = lastName;
    this._password = password;
    this._email = props.email;
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

  static errorCodes = {
    DUPLICATED_ROLES: 'DUPLICATED_ROLES',
  };

  private addRoles(roles: UserRoles[]): void {
    for (const role of roles) {
      if (this._roles.includes(role)) throw new Error(User.errorCodes.DUPLICATED_ROLES);
      this._roles.push(role);
    }
  }
}

interface Props {
  firstName?: string;
  password?: string;
  lastName?: string;
  email: string;
  roles?: UserRoles[];
  cpf?: string;
  id: string;
}
