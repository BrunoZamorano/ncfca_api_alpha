import { Inject } from '@nestjs/common';

import HashingService from '@/domain/services/hashing-service';
import TokenService from '@/application/services/token-service';

import { DomainException } from '@/domain/exceptions/domain-exception';
import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';

import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, TOKEN_SERVICE } from '@/shared/constants/service-constants';

export default class Login {
  constructor(
    @Inject(FAMILY_REPOSITORY) private readonly familyRepository: FamilyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(HASHING_SERVICE) private readonly hashingService: HashingService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute({ email, password }: Input): Promise<Output> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new DomainException(Login.errorCodes.INVALID_CREDENTIALS);
    if (!this.isValidPassword(password, user.password)) throw new DomainException(Login.errorCodes.INVALID_CREDENTIALS);
    const family = await this.familyRepository.findByHolderId(user.id);
    if (!family) throw new DomainException(Login.errorCodes.FAMILY_NOT_FOUND);
    const payload = { sub: user.id, roles: user.roles, email: user.email, familyId: family.id };
    return {
      refreshToken: await this.tokenService.signRefreshToken(payload),
      accessToken: await this.tokenService.signAccessToken(payload),
    };
  }

  private isValidPassword(password: string, hash: string) {
    return this.hashingService.compare(password, hash);
  }

  static errorCodes = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    FAMILY_NOT_FOUND: 'FAMILY_NOT_FOUND',
  };
}

interface Input {
  email: string;
  password: string;
}

interface Output {
  accessToken: string;
  refreshToken: string;
}
