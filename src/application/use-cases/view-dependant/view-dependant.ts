import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import Dependant from '@/domain/entities/dependant/dependant';
import { HolderDto } from '@/domain/dtos/holder.dto';

@Injectable()
export default class ViewDependant {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(dependantId: string): Promise<{ holder: HolderDto; dependant: Dependant }> {
    const dependant = await this.uow.familyRepository.findDependant(dependantId);
    if (!dependant) throw new EntityNotFoundException('Dependant', dependantId);
    const family = await this.uow.familyRepository.find(dependant.familyId);
    if (!family) throw new EntityNotFoundException('Family', dependant.familyId);
    const holder = await this.uow.userRepository.find(family.holderId);
    if (!holder) throw new EntityNotFoundException('Holder', family.holderId);
    return {
      dependant,
      holder: {
        email: holder.email,
        firstName: holder.firstName,
        lastName: holder.lastName,
        phone: holder.phone,
        id: holder.id,
      },
    };
  }
}
