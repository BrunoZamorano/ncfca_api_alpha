import { Inject } from '@nestjs/common';

import TokenService, { Payload } from '@/application/services/token-service';
import IdGenerator from '@/application/services/id-generator';

import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';
import UserFactory from '@/domain/factories/user.factory';
import Family from '@/domain/entities/family/family';

import { USER_FACTORY } from '@/shared/constants/factories-constants';
import { ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';

export default class RegisterUser {
  constructor(
    @Inject(FAMILY_REPOSITORY) private readonly familyRepository: FamilyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(USER_FACTORY) private readonly userFactory: UserFactory,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: Input): Promise<{ accessToken: string; refreshToken: string }> {
    if (await this.emailHasBeenUsed(input.email)) throw new Error(RegisterUser.errorCodes.EMAIL_ALREADY_IN_USE);
    const user = this.userFactory.create(input);
    const createdUser = await this.userRepository.save(user);
    const familyProps = { holderId: createdUser.id, id: this.idGenerator.generate() };
    const family = await this.familyRepository.save(new Family(familyProps));
    const payload: Payload = {
      sub: createdUser.id,
      roles: createdUser.roles,
      email: createdUser.email,
      familyId: family.id,
    };
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
  phone: string;
  email: string;
  cpf: string;
}
