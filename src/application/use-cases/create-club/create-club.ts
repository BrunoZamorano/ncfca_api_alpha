import { Inject, Injectable, Logger } from '@nestjs/common';

import IdGenerator from '@/application/services/id-generator';

import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { UserRoles } from '@/domain/enums/user-roles';
import Club from '@/domain/entities/club/club';

import { ID_GENERATOR } from '@/shared/constants/service-constants';
import { FamilyStatus } from '@/domain/enums/family-status';

@Injectable()
export default class CreateClub {
  private logger = new Logger(CreateClub.name);
  constructor(
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<Club> {
    return this.uow.executeInTransaction(async () => {
      this.logger.debug(`Creating club for user: ${input.loggedInUserId}`);
      const existingClub = await this.uow.clubRepository.findByOwnerId(input.loggedInUserId);
      if (existingClub) {
        this.logger.debug(`User already owns a club: ${existingClub.id}`);
        throw new InvalidOperationException('User can only own one club.');
      }
      const user = await this.uow.userRepository.find(input.loggedInUserId);
      if (!user) {
        this.logger.debug(`User not found: ${input.loggedInUserId}`);
        throw new EntityNotFoundException('User', input.loggedInUserId);
      }
      const family = await this.uow.familyRepository.findByHolderId(input.loggedInUserId);
      if (!family) {
        this.logger.debug(`Family not found for user: ${input.loggedInUserId}`);
        throw new EntityNotFoundException('Family', input.loggedInUserId);
      }
      if (family.status !== FamilyStatus.AFFILIATED) {
        this.logger.debug(`Family is not affiliated: ${family.id}`);
        throw new InvalidOperationException('Family must be affiliated to create a club.');
      }
      user.assignRoles([UserRoles.DONO_DE_CLUBE]);
      await this.uow.userRepository.save(user);
      const clubInstance = new Club({
        principalId: input.loggedInUserId,
        name: input.name,
        city: input.city,
        id: this._idGenerator.generate(),
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
