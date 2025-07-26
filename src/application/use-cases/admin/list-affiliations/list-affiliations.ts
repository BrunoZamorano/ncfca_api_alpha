import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { AffiliationDto } from '@/domain/dtos/affiliation.dto';
import FamilyMapper from '@/shared/mappers/family.mapper';
import UserMapper from '@/shared/mappers/user.mapper';

@Injectable()
export default class AdminListAffiliations {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}
  async execute(): Promise<Output> {
    const families = await this.uow.familyRepository.findAll();
    const affiliations = families
      .map(async (family) => {
        const holder = await this.uow.userRepository.find(family.holderId);
        if (!holder) throw new Error(`Holder not found for family with ID: ${family.id}`);
        return {
          ...FamilyMapper.entityToDto(family),
          holder: UserMapper.entityToDto(holder),
        };
      });
    return Promise.all(affiliations);
  }
}

type Output = AffiliationDto[];
