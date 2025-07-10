import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

@Injectable()
export default class AdminViewUserFamily {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}
  async execute(userId: string) {
    const user = await this.uow.userRepository.find(userId);
    if (!user) throw new EntityNotFoundException('User', userId);
    const family = await this.uow.familyRepository.findByHolderId(userId);
    return { user, family };
  }
}
