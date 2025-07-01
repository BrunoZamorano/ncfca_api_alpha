import { Inject, Injectable } from '@nestjs/common';

import HashingService from '@/application/services/hashing-service';
import IdGenerator from '@/application/services/id-generator';

import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';
import Family from '@/domain/entities/family/family';
import User from '@/domain/entities/user/user';

import { FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE, ID_GENERATOR } from '@/shared/constants/service-constants';

@Injectable()
export default class RegisterUser {
  constructor(
    @Inject(FAMILY_REPOSITORY) private readonly familyRepository: FamilyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(HASHING_SERVICE) private readonly hashingService: HashingService,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: Input): Promise<{ user: User; familyId: string }> {
    if (await this.emailHasBeenUsed(input.email)) throw new Error(RegisterUser.errorCodes.EMAIL_ALREADY_IN_USE);
    const props = { id: this.idGenerator.generate(), ...input, password: this.hashingService.hash(input.password) };
    const user = await this.userRepository.save(new User(props));
    const familyProps = { holderId: user.id, id: this.idGenerator.generate() };
    const family = await this.familyRepository.save(new Family(familyProps));
    return { familyId: family.id, user };
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
}
