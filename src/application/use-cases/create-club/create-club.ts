import { Inject } from '@nestjs/common';

import IdGenerator from '@/application/services/id-generator';

import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import FamilyRepository from '@/domain/repositories/family-repository';
import UserRepository from '@/domain/repositories/user-repository';
import ClubRepository from '@/domain/repositories/club-repository';
import Club from '@/domain/entities/club/club';

import { CLUB_REPOSITORY, FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import { ID_GENERATOR } from '@/shared/constants/service-constants';

export default class CreateClub {
  constructor(
    @Inject(FAMILY_REPOSITORY) private readonly _familyRepository: FamilyRepository,
    @Inject(CLUB_REPOSITORY) private readonly _clubRepository: ClubRepository,
    @Inject(USER_REPOSITORY) private readonly _userRepository: UserRepository,
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
  ) {}

  async execute(input: Input): Promise<Club> {
    const user = await this._userRepository.find(input.ownerId);
    if (!user) throw new EntityNotFoundException('User', input.ownerId);
    const family = await this._familyRepository.findByHolderId(input.ownerId);
    if (!family) throw new EntityNotFoundException('Family', 'OwnerId: ' + input.ownerId);
    const clubInstance = new Club({ ...input, id: this._idGenerator.generate() });
    return await this._clubRepository.save(clubInstance);
  }
}

interface Input {
  ownerId: string;
  city: string;
  name: string;
}
