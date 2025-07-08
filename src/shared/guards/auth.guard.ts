import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Request } from 'express';

import TokenService from '@/application/services/token-service';

import { UnauthorizedException } from '@/domain/exceptions/domain-exception';

import { TOKEN_SERVICE } from '@/shared/constants/service-constants';

export default class AuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly _tokenService: TokenService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);
    if (!token) throw new UnauthorizedException();
    try {
      request['user'] = await this._tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromRequest(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
