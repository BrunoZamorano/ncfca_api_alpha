import { Inject } from '@nestjs/common';

import HashingService from '@/domain/services/hashing-service';

import UserRepository from '@/domain/repositories/user-repository';
import { EntityNotFoundException, UnauthorizedException } from '@/domain/exceptions/domain-exception';

import { USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { HASHING_SERVICE } from '@/shared/constants/service-constants';

export default class ChangeUserPassword {
  constructor(
    @Inject(USER_REPOSITORY) private readonly _userRepository: UserRepository,
    @Inject(HASHING_SERVICE) private readonly _hashingService: HashingService,
  ) {}

  async execute(input: Input): Promise<void> {
    const user = await this._userRepository.find(input.id);
    if (!user) throw new EntityNotFoundException('User', input.id);
    user.changePassword(input.password, input.newPassword, this._hashingService);
    await this._userRepository.save(user);
  }

  static errorCodes = {
    SAME_PASSWORD: 'SAME_PASSWORD',
  };
}

interface Input {
  newPassword: string;
  password: string;
  id: string;
}
