import { IsArray, IsEnum } from 'class-validator';
import { UserRoles } from '@/domain/enums/user-roles';

export class ManageUserRoleDto {
  @IsArray()
  @IsEnum(UserRoles, { each: true })
  roles: UserRoles[];
}
