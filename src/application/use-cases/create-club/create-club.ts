import { Inject, Injectable } from '@nestjs/common';

import IdGenerator from '@/application/services/id-generator';

import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { UserRoles } from '@/domain/enums/user-roles';
import Club from '@/domain/entities/club/club';

import { ID_GENERATOR } from '@/shared/constants/service-constants';

@Injectable()
export default class CreateClub {
  constructor(
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<Club> {
    return this.uow.executeInTransaction(async () => {
      const existingClub = await this.uow.clubRepository.findByOwnerId(input.loggedInUserId);
      if (existingClub) throw new InvalidOperationException('User can only own one club.');
      const user = await this.uow.userRepository.find(input.loggedInUserId);
      if (!user) throw new EntityNotFoundException('User', input.loggedInUserId);
      user.addRoles([UserRoles.DONO_DE_CLUBE]);
      await this.uow.userRepository.save(user);
      const clubInstance = new Club({
        ownerId: input.loggedInUserId,
        name: input.name,
        city: input.city,
        id: this._idGenerator.generate()
      });
      return await this.uow.clubRepository.save(clubInstance);
    });
  }
}

interface Input {
  loggedInUserId: string;
  city: string;
  name: string;
}