import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import TokenService, { DecodedToken, Payload } from '@/application/services/token-service';

@Injectable()
export default class TokenServiceJwt implements TokenService {
  private readonly REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET ?? '<refresh-token-secret>';
  private readonly ACCESS_TOKEN_SECRET: string = process.env.ACCESS_TOKEN_SECRET ?? '<access-token-secret>';

  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: Payload): Promise<string> {
    return await this.jwtService.signAsync(payload, { secret: this.ACCESS_TOKEN_SECRET, expiresIn: '1h' });
  }

  async signRefreshToken(payload: Payload): Promise<string> {
    return await this.jwtService.signAsync(payload, { secret: this.REFRESH_TOKEN_SECRET, expiresIn: '1d' });
  }

  async decode(token: string): Promise<DecodedToken> {
    return this.jwtService.decode<DecodedToken>(token);
  }

  async verifyAccessToken(token: string): Promise<DecodedToken> {
    return await this.jwtService.verifyAsync<DecodedToken>(token, { secret: this.ACCESS_TOKEN_SECRET });
  }

  async verifyRefreshToken(token: string): Promise<DecodedToken> {
    return await this.jwtService.verifyAsync<DecodedToken>(token, { secret: this.REFRESH_TOKEN_SECRET });
  }
}
