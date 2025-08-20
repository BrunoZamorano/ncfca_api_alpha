import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import TokenService, { DecodedToken, Payload } from '@/application/services/token-service';

@Injectable()
export default class TokenServiceJwt implements TokenService {
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRATION: string;
  private readonly REFRESH_TOKEN_EXPIRATION: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.REFRESH_TOKEN_SECRET = this.configService.get<string>('REFRESH_TOKEN_SECRET') ?? '<refresh-token-secret>';
    this.ACCESS_TOKEN_SECRET = this.configService.get<string>('ACCESS_TOKEN_SECRET') ?? '<access-token-secret>';
    this.ACCESS_TOKEN_EXPIRATION = this.configService.get<string>('ACCESS_TOKEN_EXPIRATION') ?? '15m';
    this.REFRESH_TOKEN_EXPIRATION = this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') ?? '1d';
  }

  async signAccessToken(payload: Payload): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.ACCESS_TOKEN_SECRET,
      expiresIn: this.ACCESS_TOKEN_EXPIRATION,
    });
  }

  async signRefreshToken(payload: Payload): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.REFRESH_TOKEN_SECRET,
      expiresIn: this.REFRESH_TOKEN_EXPIRATION,
    });
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
