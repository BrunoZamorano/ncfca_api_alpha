import TokenService, { DecodedToken } from '@/application/services/token-service';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { TOKEN_SERVICE } from '@/shared/constants/service-constants';

export default class ValidateToken {
  constructor(@Inject(TOKEN_SERVICE) private readonly _tokenSevice: TokenService) {}

  async execute(token: string): Promise<DecodedToken> {
    try {
      return await this._tokenSevice.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
