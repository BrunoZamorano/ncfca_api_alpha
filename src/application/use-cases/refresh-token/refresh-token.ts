import { Inject } from '@nestjs/common';

import TokenService, { Payload } from '@/application/services/token-service';

import UnauthorizedException from '@/domain/errors/domain-exception';

import { TOKEN_SERVICE } from '@/shared/constants/service-constants';

export default class RefreshToken {
  constructor(@Inject(TOKEN_SERVICE) private readonly _tokenService: TokenService) {}

  async execute(token: string): Promise<Output> {
    const decoded = await this._tokenService.verifyRefreshToken(token);
    if (!decoded) throw new UnauthorizedException(RefreshToken.errorCodes.INVALID_TOKEN);
    const { familyId, email, roles, sub } = decoded;
    const payload: Payload = { familyId, email, roles, sub };
    return {
      accessToken: await this._tokenService.signAccessToken(payload),
      refreshToken: await this._tokenService.signRefreshToken(payload),
    };
  }

  static errorCodes = {
    INVALID_TOKEN: 'INVALID_TOKEN',
  };
}

export interface Output {
  refreshToken: string;
  accessToken: string;
}
