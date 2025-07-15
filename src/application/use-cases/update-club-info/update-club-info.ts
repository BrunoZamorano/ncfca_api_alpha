import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';

@Injectable()
export default class UpdateClubInfo {
  constructor(@Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork) {}

  async execute(input: UpdateClubInfoInput): Promise<void> {
    return this.uow.executeInTransaction(async () => {
      const club = await this.uow.clubRepository.find(input.clubId);
      if (!club) {
        throw new EntityNotFoundException('Club', input.clubId);
      }

      if (club.principalId !== input.loggedInUserId) {
        throw new ForbiddenException('User is not authorized to edit this club.');
      }

      club.updateInfo({ name: input.name, city: input.city });

      await this.uow.clubRepository.save(club);
    });
  }
}

interface UpdateClubInfoInput {
  loggedInUserId: string;
  clubId: string;
  name?: string;
  city?: string;
}