import TokenService, { DecodedToken } from '@/application/services/token-service';
import { Inject } from '@nestjs/common';
import { TOKEN_SERVICE } from '@/shared/constants/service-constants';

export default class ValidateToken {
  constructor(@Inject(TOKEN_SERVICE) private readonly _tokenSevice: TokenService) {}

  async execute(token: string): Promise<DecodedToken> {
    return this._tokenSevice.verifyAccessToken(token);
  }
}
