import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import Dependant from '@/domain/entities/dependant/dependant';

@Injectable()
export default class ListDependants {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(loggedInUserId: string): Promise<Dependant[]> {
    const family = await this.uow.familyRepository.findByHolderId(loggedInUserId);
    if (!family) throw new EntityNotFoundException('Family', `for user ${loggedInUserId}`);
    return family.dependants;
  }
}