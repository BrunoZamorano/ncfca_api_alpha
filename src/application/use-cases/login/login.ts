import { Inject, Logger, UnauthorizedException } from '@nestjs/common';

import HashingService from '@/domain/services/hashing-service';
import TokenService from '@/application/services/token-service';

import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';

import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { UserRoles } from '@/domain/enums/user-roles';

export default class Login {
  private readonly logger = new Logger(Login.name);

  constructor(
    @Inject(FAMILY_REPOSITORY) private readonly familyRepository: FamilyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(HASHING_SERVICE) private readonly hashingService: HashingService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute({ email, password }: Input): Promise<Output> {
    this.logger.debug(`Executando Login para o email: ${email}`);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.debug(`Usuário não encontrado para o email: ${email}`);
      throw new UnauthorizedException(Login.errorCodes.INVALID_CREDENTIALS);
    }
    if (user.roles.includes(UserRoles.ADMIN)) {
      const payload = { sub: user.id, roles: user.roles, email: user.email, familyId: '' };
      this.logger.debug(`Login bem-sucedido para o usuário admin: ${email}`);
      return {
        refreshToken: await this.tokenService.signRefreshToken(payload),
        accessToken: await this.tokenService.signAccessToken(payload),
      };
    }
    if (!this.isValidPassword(password, user.password)) {
      this.logger.debug(`Senha inválida para o usuário: ${email}`);
      throw new UnauthorizedException(Login.errorCodes.INVALID_CREDENTIALS);
    }
    const family = await this.familyRepository.findByHolderId(user.id);
    if (!family) {
      this.logger.debug(`Família não encontrada para o usuário: ${email}`);
      throw new InvalidOperationException(Login.errorCodes.FAMILY_NOT_FOUND);
    }
    const payload = { sub: user.id, roles: user.roles, email: user.email, familyId: family.id };
    this.logger.debug(`Login bem-sucedido para o usuário: ${email}`);
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
  password: string;
  email: string;
}

interface Output {
  refreshToken: string;
  accessToken: string;
}
