// src/infraestructure/dtos/manage-user-role.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { UserRoles } from '@/domain/enums/user-roles';

export class ManageUserRoleDto {
  @ApiProperty({
    description: 'Lista de perfis (roles) a serem atribuídos ao usuário. Substitui os perfis existentes.',
    enum: UserRoles,
    isArray: true,
    example: [UserRoles.DONO_DE_CLUBE],
  })
  @IsArray()
  @IsEnum(UserRoles, { each: true })
  roles: UserRoles[];
}
