import { Inject } from '@nestjs/common';

import TokenService, { Payload } from '@/application/services/token-service';
import HashingService from '@/application/services/hashing-service';
import IdGenerator from '@/application/services/id-generator';

import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';
import Family from '@/domain/entities/family/family';
import User from '@/domain/entities/user/user';

import { HASHING_SERVICE, ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';

export default class RegisterUser {
  constructor(
    @Inject(FAMILY_REPOSITORY) private readonly familyRepository: FamilyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(HASHING_SERVICE) private readonly hashingService: HashingService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: Input): Promise<{ accessToken: string; refreshToken: string }> {
    if (await this.emailHasBeenUsed(input.email)) throw new Error(RegisterUser.errorCodes.EMAIL_ALREADY_IN_USE);
    const props = { id: this.idGenerator.generate(), ...input, password: this.hashingService.hash(input.password) };
    const user = await this.userRepository.save(new User(props));
    const familyProps = { holderId: user.id, id: this.idGenerator.generate() };
    const family = await this.familyRepository.save(new Family(familyProps));
    const payload: Payload = { sub: user.id, roles: user.roles, email: user.email, familyId: family.id };
    return {
      refreshToken: await this.tokenService.signRefreshToken(payload),
      accessToken: await this.tokenService.signAccessToken(payload),
    };
  }

  private async emailHasBeenUsed(email: string): Promise<boolean> {
    return !!(await this.userRepository.findByEmail(email));
  }

  static errorCodes = {
    EMAIL_ALREADY_IN_USE: 'EMAIL_ALREADY_IN_USE',
    INVALID_CPF: 'INVALID_CPF',
  };
}

interface Input {
  firstName: string;
  lastName: string;
  password: string;
  clubId?: string;
  email: string;
  cpf: string;
}
