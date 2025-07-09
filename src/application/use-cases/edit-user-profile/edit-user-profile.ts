import { Inject } from '@nestjs/common';

import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import UserRepository from '@/domain/repositories/user-repository';
import User from '@/domain/entities/user/user';

import { USER_REPOSITORY } from '@/shared/constants/repository-constants';

export default class EditUserProfile {
  constructor(@Inject(USER_REPOSITORY) private readonly _userRepository: UserRepository) {}

  async execute({ id,  ...input }: Input): Promise<User> {
    const user = await this._userRepository.find(id);
    if (!user) throw new EntityNotFoundException('User', id);
    user.updateProfile(input);
    return this._userRepository.save(user);
  }
}

interface Input {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  id: string;
}
