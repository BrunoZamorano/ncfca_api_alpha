import { Inject } from '@nestjs/common';

import HashingService from '@/domain/services/hashing-service';

import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

import { HASHING_SERVICE } from '@/shared/constants/service-constants';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';

export default class ChangeUserPassword {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(HASHING_SERVICE) private readonly _hashingService: HashingService,
  ) {}

  async execute(input: Input): Promise<void> {
    const user = await this.uow.userRepository.find(input.id);
    if (!user) throw new EntityNotFoundException('User', input.id);
    user.changePassword(input.password, input.newPassword, this._hashingService);
    await this.uow.userRepository.save(user);
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
