// src/domain/dtos/user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { UserRoles } from '../enums/user-roles';
import { AddressDto } from '@/domain/dtos/address.dto';

export class UserDto {
  @ApiProperty({ description: 'ID único do usuário.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Email de contato do usuário.', example: 'joao.silva@example.com' })
  email: string;

  @ApiProperty({ description: 'Primeiro nome do usuário.', example: 'João' })
  firstName: string;

  @ApiProperty({ description: 'Último nome do usuário.', example: 'Silva' })
  lastName: string;

  @ApiProperty({ description: 'Telefone do usuário.', example: '5511987654321' })
  phone: string;

  @ApiProperty({ description: 'CPF do usuário.', example: '12345678900' })
  cpf: string;

  @ApiProperty({ description: 'Rg do usuário.', example: '123456' })
  rg: string;

  @ApiProperty({
    description: 'Perfis de acesso do usuário.',
    enum: UserRoles,
    isArray: true,
    example: [UserRoles.SEM_FUNCAO],
  })
  roles: UserRoles[];

  @ApiProperty({ description: 'Endereço completo do usuário.' })
  address: AddressDto;
}
