import { User as Model } from '@prisma/client'; // Importando o tipo gerado pelo Prisma

import { UserRoles } from '@/domain/enums/user-roles';
import Password from '@/domain/value-objects/password/password';
import Address from '@/domain/value-objects/address/address';
import Entity from '@/domain/entities/user/user';
import Email from '@/domain/value-objects/email/email';
import Cpf from '@/domain/value-objects/cpf/cpf';

export default class UserMapper {
  static toEntity(data: Model): Entity {
    const user = new Entity({
      firstName: data.first_name,
      lastName: data.last_name,
      password: Password.fromHash(data.password),
      roles: data.roles.split(',') as UserRoles[],
      phone: data.phone,
      email: new Email(data.email),
      cpf: new Cpf(data.cpf),
      rg: data.rg,
      id: data.id,
      address: new Address({
        complement: data.complement ?? undefined,
        district: data.neighborhood,
        zipCode: data.zip_code,
        street: data.street,
        number: data.number,
        state: data.state,
        city: data.city,
      }),
    });

    if (data.roles && data.roles.length > 0) {
      const roles = data.roles.split(',') as UserRoles[];
      user.assignRoles(roles);
    }

    return user;
  }

  static toPersistence(entity: Entity): Omit<Model, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      first_name: entity.firstName,
      last_name: entity.lastName,
      email: entity.email,
      password: entity.password,
      phone: entity.phone,
      cpf: entity.cpf,
      rg: entity.rg,
      roles: entity.roles.join(','),
      street: entity.address.street,
      number: entity.address.number,
      complement: entity.address.complement ?? null,
      neighborhood: entity.address.district,
      city: entity.address.city,
      state: entity.address.state,
      zip_code: entity.address.zipCode,
    };
  }
}
