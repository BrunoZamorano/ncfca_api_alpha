import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import Family from '@/domain/entities/family/family';
import { Inject } from '@nestjs/common';

export default class ViewMyFamily {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: Input): Promise<Family> {
    const myFamily = await this.uow.familyRepository.findByHolderId(input.loggedInUserId);
    if (!myFamily) throw new EntityNotFoundException('Family', `Holder ID: ${input.loggedInUserId}`);
    return myFamily;
  }
}

interface Input {
  loggedInUserId: string;
}
