import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

@Injectable()
export default class DeleteDependant {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(loggedInUserId: string, dependantId: string): Promise<void> {
    await this.uow.beginTransaction();
    try {
      const family = await this.uow.familyRepository.findByHolderId(loggedInUserId);
      if (!family) throw new EntityNotFoundException('Family', `for user: ${loggedInUserId}`);

      family.removeDependant(dependantId);

      await this.uow.familyRepository.save(family);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
