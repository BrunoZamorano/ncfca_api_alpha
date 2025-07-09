import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { UpdateDependantProps } from '@/domain/entities/dependant/dependant';

@Injectable()
export default class UpdateDependant {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: UpdateDependantInput): Promise<void> {
    await this.uow.beginTransaction();
    try {
      const family = await this.uow.familyRepository.findByHolderId(input.loggedInUserId);
      if (!family) throw new EntityNotFoundException('Family', `for user ${input.loggedInUserId}`);
      family.updateDependantInfo(input.dependantId, {
        firstName: input.firstName,
        lastName: input.lastName,
        birthdate: input.birthdate,
        relationship: input.relationship,
        sex: input.sex,
        email: input.email,
        phone: input.phone,
      });
      await this.uow.familyRepository.save(family);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}

export interface UpdateDependantInput extends UpdateDependantProps {
  loggedInUserId: string;
  dependantId: string;
}
