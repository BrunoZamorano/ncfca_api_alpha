import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

import { UserRoles } from '@/domain/enums/user-roles';
import { HttpUser } from '@/infraestructure/controllers/club-request.controller';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<HttpUser>();
    if (!user || !user.roles || !user.roles.includes(UserRoles.ADMIN)) {
      throw new ForbiddenException('Access denied. Admin role required.');
    }
    return true;
  }
}
