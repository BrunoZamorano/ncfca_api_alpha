import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoles } from '@/domain/enums/user-roles';
import { ROLES_KEY } from '@/shared/decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Se nenhum perfil é exigido, permite o acesso.
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      return false; // Usuário não autenticado ou sem perfis no token.
    }

    if (!requiredRoles.some((role) => user.roles.includes(role))) throw new ForbiddenException();
    return true;
  }
}
