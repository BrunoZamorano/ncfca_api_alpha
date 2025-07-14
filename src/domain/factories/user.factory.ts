import { Inject, Injectable } from '@nestjs/common';

import IdGenerator from '@/application/services/id-generator';

import HashingService from '@/domain/services/hashing-service';
import { UserRoles } from '@/domain/enums/user-roles';
import Password from '@/domain/value-objects/password/password';
import User from '@/domain/entities/user/user';
import Cpf from '@/domain/value-objects/cpf/cpf';

import { HASHING_SERVICE, ID_GENERATOR } from '@/shared/constants/service-constants';
import Email from '@/domain/value-objects/email/email';
import { AddressProps } from '@/domain/value-objects/address/address';

@Injectable()
export default class UserFactory {
  constructor(
    @Inject(HASHING_SERVICE) private readonly hashingService: HashingService,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  create(props?: CreateUserProps): User {
    const password = Password.create(props?.password ?? User.DEFAULT_PASSWORD, this.hashingService);
    const user = new User({
      firstName: props?.firstName ?? User.DEFAULT_FIRST_NAME,
      lastName: props?.lastName ?? User.DEFAULT_LAST_NAME,
      password: password ?? Password.fromHash(User.DEFAULT_PASSWORD),
      address: props?.address,
      email: props?.email ? new Email(props.email) : new Email(User.DEFAULT_EMAIL),
      phone: props?.phone ?? User.DEFAULT_PHONE,
      cpf: props?.cpf ? new Cpf(props?.cpf) : new Cpf(),
      rg: props?.rg ?? User.DEFAULT_RG,
      id: props?.id ?? this.idGenerator.generate(),
    });
    user.addRoles([...(props?.roles ?? []), UserRoles.SEM_FUNCAO]);
    return user;
  }
}

export interface CreateUserProps {
  firstName?: string;
  password?: string;
  lastName?: string;
  address?: AddressProps;
  email?: string;
  phone?: string;
  roles?: UserRoles[];
  cpf?: string;
  rg?: string;
  id?: string;
}
