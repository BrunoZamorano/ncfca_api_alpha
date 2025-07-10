import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';

@Injectable()
export default class AdminListAffiliations {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}
  async execute() {
    return this.uow.familyRepository.findAll();
  }
}
