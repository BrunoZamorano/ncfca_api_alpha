export default interface TokenService {
  signAccessToken(payload: Payload): Promise<string>;
  signRefreshToken(payload: Payload): Promise<string>;
  decode(token: string): Promise<DecodedToken>;
  verifyAccessToken(token: string): Promise<DecodedToken>;
  verifyRefreshToken(token: string): Promise<DecodedToken>;
}

export interface Payload {
  familyId: string;
  roles: string[];
  email: string;
  sub: string;
}

export interface DecodedToken {
  familyId: string;
  roles: string[];
  email: string;
  sub: string;
  iat: number;
  exp: number;
}
