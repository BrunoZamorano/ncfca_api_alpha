import TokenService, { DecodedToken } from '@/application/services/token-service';
import User from '@/domain/entities/user/user';
import { UserRoles } from '@/domain/enums/user-roles';
import { JsonWebTokenError } from '@nestjs/jwt';

export default class AnemicTokenService implements TokenService {
  static readonly REFRESH_TOKEN = '<refresh-token>';
  static readonly ACCESS_TOKEN = '<access-token>';
  static readonly stubDecodedToken: DecodedToken = {
    familyId: 'anemic-family-id',
    roles: [UserRoles.SEM_FUNCAO],
    email: User.DEFAULT_EMAIL,
    sub: 'anemic-id',
    iat: Date.now(),
    exp: Date.now() + 3600 * 1000,
  };

  async decode(token: string): Promise<DecodedToken> {
    if (!this.isTokenValid(token)) throw new Error('Invalid token');
    return AnemicTokenService.stubDecodedToken;
  }

  async verifyAccessToken(token: string): Promise<DecodedToken> {
    if (token !== AnemicTokenService.ACCESS_TOKEN) throw new JsonWebTokenError('Invalid token');
    return AnemicTokenService.stubDecodedToken;
  }

  async verifyRefreshToken(token: string): Promise<DecodedToken> {
    if (token !== AnemicTokenService.REFRESH_TOKEN) throw new JsonWebTokenError('Invalid token');
    return AnemicTokenService.stubDecodedToken;
  }

  async signAccessToken(): Promise<string> {
    return AnemicTokenService.ACCESS_TOKEN;
  }

  async signRefreshToken(): Promise<string> {
    return AnemicTokenService.REFRESH_TOKEN;
  }

  private isTokenValid(token: string) {
    return token === AnemicTokenService.ACCESS_TOKEN || token === AnemicTokenService.REFRESH_TOKEN;
  }
}
