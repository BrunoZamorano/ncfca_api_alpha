import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import Dependant from '@/domain/entities/dependant/dependant';
import Birthdate from '@/domain/value-objects/birthdate/birthdate';
import Email from '@/domain/value-objects/email/email';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import IdGenerator from '@/application/services/id-generator';
import { Sex } from '@/domain/enums/sex';
import { DependantRelationship } from '@/domain/enums/dependant-relationship';
import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { FamilyStatus } from '@/domain/enums/family-status';

export interface AddDependantInput {
  loggedInUserId: string;
  relationship: DependantRelationship;
  birthdate: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  sex: Sex;
}

@Injectable()
export default class AddDependant {
  constructor(
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
  ) {}

  async execute(input: AddDependantInput): Promise<Dependant> {
    await this.uow.beginTransaction();
    try {
      const family = await this.uow.familyRepository.findByHolderId(input.loggedInUserId);
      if (!family) throw new EntityNotFoundException('Family', `for user ${input.loggedInUserId}`);
      if (family.status !== FamilyStatus.AFFILIATED){
        throw new ForbiddenException('Family must be affiliated to add dependants');
      }
      const holder = await this.uow.userRepository.find(input.loggedInUserId);
      if (!holder) throw new EntityNotFoundException('User', input.loggedInUserId);
      const dependant = new Dependant({
        id: this.idGenerator.generate(),
        sex: input.sex,
        phone: input.phone,
        email: input.email ? new Email(input.email) : undefined,
        firstName: input.firstName,
        lastName: input.lastName,
        birthdate: new Birthdate(input.birthdate),
        relationship: input.relationship,
      });
      family.addDependant(dependant);
      await this.uow.familyRepository.save(family);
      await this.uow.commit();
      return dependant;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
