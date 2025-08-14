import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import User from '@/domain/entities/user/user';

@Injectable()
export default class AdminGetUser {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(userId: string): Promise<User> {
    const user = await this.uow.userRepository.find(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }
    return user;
  }
}
